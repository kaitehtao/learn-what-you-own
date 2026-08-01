-- Public member profiles, follows, and per-message visibility.

create table if not exists public.member_follows (
  follower_id uuid not null references public.profiles(user_id) on delete cascade,
  followed_id uuid not null references public.profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followed_id),
  constraint member_follows_not_self check (follower_id <> followed_id)
);

create index if not exists member_follows_followed_idx
  on public.member_follows (followed_id, created_at desc);
create index if not exists member_follows_follower_idx
  on public.member_follows (follower_id, created_at desc);

alter table public.member_follows enable row level security;

drop policy if exists "Following relationships are public" on public.member_follows;
create policy "Following relationships are public"
on public.member_follows for select using (true);

drop policy if exists "Members follow from their own account" on public.member_follows;
create policy "Members follow from their own account"
on public.member_follows for insert
with check (auth.uid() = follower_id and follower_id <> followed_id);

drop policy if exists "Members unfollow from their own account" on public.member_follows;
create policy "Members unfollow from their own account"
on public.member_follows for delete
using (auth.uid() = follower_id);

grant select on public.member_follows to anon, authenticated;
grant insert, delete on public.member_follows to authenticated;

alter table public.private_messages
  add column if not exists visibility text not null default 'private';

alter table public.private_messages
  drop constraint if exists private_messages_visibility_check;
alter table public.private_messages
  add constraint private_messages_visibility_check
  check (visibility in ('private', 'public'));

drop policy if exists "Public messages are readable" on public.private_messages;
create policy "Public messages are readable"
on public.private_messages for select
using (
  visibility = 'public'
  and sender_deleted_at is null
  and recipient_deleted_at is null
);

grant select on public.private_messages to anon, authenticated;

revoke all on function public.send_private_message(text, text, text) from public;
revoke all on function public.send_private_message(text, text, text) from authenticated;
drop function if exists public.send_private_message(text, text, text);

create or replace function public.send_member_message(
  recipient_username text,
  message_subject text,
  message_body text,
  message_visibility text default 'private'
)
returns public.private_messages
language plpgsql
security definer set search_path = public
as $$
declare
  sender uuid := auth.uid();
  recipient uuid;
  chosen_visibility text := lower(trim(coalesce(message_visibility, 'private')));
  created_message public.private_messages;
begin
  if sender is null then
    raise exception 'Authentication required';
  end if;
  if not exists (
    select 1 from public.profiles
    where user_id = sender and onboarding_complete = true
  ) then
    raise exception 'Complete your member profile before sending messages';
  end if;

  select user_id into recipient
  from public.profiles
  where lower(username) = lower(trim(recipient_username))
    and onboarding_complete = true
  limit 1;

  if recipient is null then
    raise exception 'Recipient username not found';
  end if;
  if recipient = sender then
    raise exception 'You cannot message yourself';
  end if;
  if chosen_visibility not in ('private', 'public') then
    raise exception 'Message visibility must be private or public';
  end if;
  if length(trim(coalesce(message_subject, ''))) not between 1 and 120 then
    raise exception 'Subject must be between 1 and 120 characters';
  end if;
  if length(trim(coalesce(message_body, ''))) not between 1 and 5000 then
    raise exception 'Message must be between 1 and 5000 characters';
  end if;

  insert into public.private_messages (sender_id, recipient_id, subject, body, visibility)
  values (sender, recipient, trim(message_subject), trim(message_body), chosen_visibility)
  returning * into created_message;
  return created_message;
end;
$$;

revoke all on function public.send_member_message(text, text, text, text) from public;
grant execute on function public.send_member_message(text, text, text, text) to authenticated;
