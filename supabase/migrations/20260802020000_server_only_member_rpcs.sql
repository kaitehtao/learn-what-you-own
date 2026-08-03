-- Keep privileged writes behind authenticated application routes. The routes
-- validate the caller with Supabase Auth, then invoke these functions with the
-- server-only service role and the verified user id.

create or replace function public.server_update_own_profile(
  actor_user_id uuid,
  new_username text,
  new_display_name text default ''
)
returns public.profiles
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  updated_profile public.profiles;
begin
  if actor_user_id is null then raise exception 'Authentication required'; end if;
  if new_username !~ '^[A-Za-z0-9_]{3,24}$' then raise exception 'Invalid username'; end if;
  update public.profiles
  set username = new_username,
      display_name = left(coalesce(nullif(trim(new_display_name), ''), new_username), 80),
      onboarding_complete = true
  where user_id = actor_user_id
  returning * into updated_profile;
  if updated_profile.user_id is null then raise exception 'Profile not found'; end if;
  return updated_profile;
end;
$$;

create or replace function public.server_send_member_message(
  actor_user_id uuid,
  recipient_username text,
  message_subject text,
  message_body text,
  message_visibility text default 'private'
)
returns public.private_messages
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  recipient uuid;
  sender_username text;
  chosen_visibility text := lower(trim(coalesce(message_visibility, 'private')));
  created_message public.private_messages;
  created_notification public.notifications;
  preference text;
begin
  if actor_user_id is null then raise exception 'Authentication required'; end if;
  select username into sender_username from public.profiles
  where user_id = actor_user_id and onboarding_complete = true;
  if sender_username is null then raise exception 'Complete your member profile before sending messages'; end if;

  select user_id into recipient from public.profiles
  where lower(username) = lower(trim(recipient_username)) and onboarding_complete = true limit 1;
  if recipient is null then raise exception 'Recipient username not found'; end if;
  if recipient = actor_user_id then raise exception 'You cannot message yourself'; end if;
  if chosen_visibility not in ('private', 'public') then raise exception 'Message visibility must be private or public'; end if;
  if length(trim(coalesce(message_subject, ''))) not between 1 and 120 then raise exception 'Subject must be between 1 and 120 characters'; end if;
  if length(trim(coalesce(message_body, ''))) not between 1 and 5000 then raise exception 'Message must be between 1 and 5000 characters'; end if;

  insert into public.private_messages (sender_id, recipient_id, subject, body, visibility)
  values (actor_user_id, recipient, trim(message_subject), trim(message_body), chosen_visibility)
  returning * into created_message;

  insert into public.notification_preferences (user_id) values (recipient)
  on conflict (user_id) do nothing;

  insert into public.notifications (user_id, actor_id, kind, title, detail, href, entity_type, entity_id)
  values (
    recipient,
    actor_user_id,
    case when chosen_visibility = 'public' then 'public_message' else 'private_message' end,
    case when chosen_visibility = 'public' then 'New public message from @' else 'New private message from @' end || sender_username,
    trim(message_subject),
    '/messages?open=' || created_message.id::text,
    'message',
    created_message.id
  ) returning * into created_notification;

  select email_frequency into preference from public.notification_preferences where user_id = recipient;
  if preference in ('immediate', 'daily') then
    insert into public.email_notification_outbox (notification_id, user_id, frequency, next_attempt_at)
    values (
      created_notification.id,
      recipient,
      preference,
      case when preference = 'daily' then now() + interval '24 hours' else now() end
    ) on conflict (notification_id) do nothing;
  end if;
  return created_message;
end;
$$;

create or replace function public.server_mark_private_message_read(
  actor_user_id uuid,
  target_message_id bigint
)
returns public.private_messages
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  updated_message public.private_messages;
begin
  if actor_user_id is null then raise exception 'Authentication required'; end if;
  update public.private_messages set read_at = coalesce(read_at, now())
  where id = target_message_id and recipient_id = actor_user_id and recipient_deleted_at is null
  returning * into updated_message;
  if updated_message.id is null then raise exception 'Message not found'; end if;
  update public.notifications set read_at = coalesce(read_at, now())
  where user_id = actor_user_id and entity_type = 'message' and entity_id = target_message_id;
  return updated_message;
end;
$$;

create or replace function public.server_delete_private_message(
  actor_user_id uuid,
  target_message_id bigint
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if actor_user_id is null then raise exception 'Authentication required'; end if;
  update public.private_messages
  set sender_deleted_at = case when sender_id = actor_user_id then now() else sender_deleted_at end,
      recipient_deleted_at = case when recipient_id = actor_user_id then now() else recipient_deleted_at end
  where id = target_message_id and (sender_id = actor_user_id or recipient_id = actor_user_id);
  if not found then raise exception 'Message not found'; end if;
  delete from public.private_messages
  where id = target_message_id and sender_deleted_at is not null and recipient_deleted_at is not null;
end;
$$;

revoke all on function public.server_update_own_profile(uuid, text, text) from public, anon, authenticated;
revoke all on function public.server_send_member_message(uuid, text, text, text, text) from public, anon, authenticated;
revoke all on function public.server_mark_private_message_read(uuid, bigint) from public, anon, authenticated;
revoke all on function public.server_delete_private_message(uuid, bigint) from public, anon, authenticated;
grant execute on function public.server_update_own_profile(uuid, text, text) to service_role;
grant execute on function public.server_send_member_message(uuid, text, text, text, text) to service_role;
grant execute on function public.server_mark_private_message_read(uuid, bigint) to service_role;
grant execute on function public.server_delete_private_message(uuid, bigint) to service_role;
