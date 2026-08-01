-- Moderated upcoming-IPO and private-company dossier submissions.
-- Roadshow files remain private until an approved D1 dossier references them.

alter table public.contributions
  add column if not exists proposed_company_name text,
  add column if not exists proposed_company_slug text,
  add column if not exists company_stage text,
  add column if not exists proposed_ticker text,
  add column if not exists proposed_exchange text,
  add column if not exists expected_ipo_date date,
  add column if not exists company_website text,
  add column if not exists roadshow_title text,
  add column if not exists roadshow_storage_path text,
  add column if not exists roadshow_source_url text;

alter table public.contributions
  drop constraint if exists contributions_company_stage_check;
alter table public.contributions
  add constraint contributions_company_stage_check
  check (company_stage is null or company_stage in ('upcoming_ipo', 'private'));

alter table public.contributions
  drop constraint if exists contributions_company_proposal_fields_check;
alter table public.contributions
  add constraint contributions_company_proposal_fields_check
  check (
    contribution_type not in ('Upcoming IPO dossier', 'Private company dossier')
    or (
      length(trim(coalesce(proposed_company_name, ''))) >= 2
      and length(trim(coalesce(proposed_company_slug, ''))) >= 2
      and company_stage is not null
      and length(trim(coalesce(company_website, ''))) >= 8
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('roadshow-materials', 'roadshow-materials', false, 20971520, array['application/pdf'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Members upload roadshow PDFs" on storage.objects;
create policy "Members upload roadshow PDFs" on storage.objects for insert to authenticated
with check (
  bucket_id = 'roadshow-materials'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Members read their roadshow PDFs" on storage.objects;
create policy "Members read their roadshow PDFs" on storage.objects for select to authenticated
using (
  bucket_id = 'roadshow-materials'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid() and p.role in ('editor', 'admin')
    )
  )
);

drop policy if exists "Members remove unapproved roadshow PDFs" on storage.objects;
create policy "Members remove unapproved roadshow PDFs" on storage.objects for delete to authenticated
using (
  bucket_id = 'roadshow-materials'
  and (storage.foldername(name))[1] = auth.uid()::text
);
