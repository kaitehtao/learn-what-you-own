-- One-time founder promotion. Apply only after confirming this is the production
-- LearnWhatYouOwn Supabase project. Prefer the public host account `Yourhost`,
-- then the legacy `founder` username; the oldest profile is the controlled
-- fallback for the prototype's original first-account-is-founder convention.

do $$
declare
  founder_user_id uuid;
  previous_role text;
begin
  select user_id, role
  into founder_user_id, previous_role
  from public.profiles
  where lower(username) in ('yourhost', 'founder')
  order by case when lower(username) = 'yourhost' then 0 else 1 end, created_at asc
  limit 1;

  if founder_user_id is null then
    select user_id, role
    into founder_user_id, previous_role
    from public.profiles
    order by created_at asc
    limit 1;
  end if;

  if founder_user_id is null then
    raise notice 'No existing profile was available for founder promotion.';
    return;
  end if;

  if previous_role = 'admin' then
    raise notice 'The founder account already has administrator access.';
    return;
  end if;

  update public.profiles
  set role = 'admin'
  where user_id = founder_user_id;

  insert into public.admin_account_audit (
    actor_id,
    target_user_id,
    action,
    detail
  ) values (
    null,
    founder_user_id,
    'role_update',
    jsonb_build_object(
      'source', '20260801070000_founder_administrator.sql',
      'reason', 'Founder promoted to full administrator access',
      'from', previous_role,
      'to', 'admin'
    )
  );
end;
$$;
