-- Allow notification calls to action to deep-link directly to a review queue.
-- Notification records remain private to their recipient under the existing
-- row-level-security policies.

alter table public.notifications drop constraint if exists notifications_href_check;
alter table public.notifications add constraint notifications_href_check
  check (href ~ '^/[A-Za-z0-9_?&=/%#.-]+$');

comment on column public.notifications.href is
  'Application-relative destination. Fragment links are permitted for direct administrator review-queue navigation.';
