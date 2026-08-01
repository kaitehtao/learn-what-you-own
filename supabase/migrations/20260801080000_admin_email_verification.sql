-- Permit audited administrator actions for pending email verification.
alter table public.admin_account_audit
  drop constraint if exists admin_account_audit_action_check;

alter table public.admin_account_audit
  add constraint admin_account_audit_action_check
  check (action in ('invite', 'role_update', 'delete', 'verification_resend', 'email_confirm'));
