-- The application now invokes privileged member writes through server-only RPCs.
-- Retire the former browser-callable SECURITY DEFINER entry points and limit
-- aggregate/admin helpers to the service role.

alter function public.set_updated_at() set search_path = pg_catalog, public;

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.company_research_demand() from public, anon, authenticated;
grant execute on function public.company_research_demand() to service_role;

drop function if exists public.update_own_profile(text, text);
drop function if exists public.send_member_message(text, text, text, text);
drop function if exists public.mark_private_message_read(bigint);
drop function if exists public.delete_private_message(bigint);
