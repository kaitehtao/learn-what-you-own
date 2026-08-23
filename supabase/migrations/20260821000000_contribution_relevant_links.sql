-- Optional supporting URLs for moderated public research contributions.
-- The primary source_url remains required and retains its existing meaning.

alter table public.contributions
  add column if not exists relevant_links jsonb not null default '[]'::jsonb;

alter table public.contributions
  drop constraint if exists contributions_relevant_links_check;
alter table public.contributions
  add constraint contributions_relevant_links_check check (
    jsonb_typeof(relevant_links) = 'array'
    and jsonb_array_length(relevant_links) <= 5
  );

comment on column public.contributions.relevant_links is
  'Up to five optional supporting web links. Links remain governed by contribution RLS and become public only when the contribution is approved.';
