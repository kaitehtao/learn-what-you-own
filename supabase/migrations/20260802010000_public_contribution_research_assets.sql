-- Moderated public research reports, earnings models, and collaborative Google Sheets.

alter table public.contributions
  add column if not exists research_asset_type text,
  add column if not exists research_asset_title text,
  add column if not exists research_asset_storage_path text,
  add column if not exists research_asset_file_name text,
  add column if not exists research_asset_mime_type text,
  add column if not exists research_asset_file_size bigint,
  add column if not exists google_sheet_url text,
  add column if not exists collaboration_notes text;

alter table public.contributions drop constraint if exists contributions_research_asset_type_check;
alter table public.contributions add constraint contributions_research_asset_type_check
  check (research_asset_type is null or research_asset_type in ('earnings_model', 'research_report'));

alter table public.contributions drop constraint if exists contributions_research_asset_size_check;
alter table public.contributions add constraint contributions_research_asset_size_check
  check (research_asset_file_size is null or research_asset_file_size between 1 and 20971520);

alter table public.contributions drop constraint if exists contributions_research_asset_fields_check;
alter table public.contributions add constraint contributions_research_asset_fields_check check (
  research_asset_storage_path is null
  or (
    research_asset_type is not null
    and length(trim(research_asset_title)) between 1 and 200
    and length(trim(research_asset_file_name)) between 1 and 240
    and research_asset_mime_type in (
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    )
    and research_asset_file_size between 1 and 20971520
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'contribution-research-assets',
  'contribution-research-assets',
  false,
  20971520,
  array['application/pdf','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/csv']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Members upload contribution research assets" on storage.objects;
create policy "Members upload contribution research assets" on storage.objects for insert to authenticated
with check (
  bucket_id = 'contribution-research-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Members read their contribution research assets" on storage.objects;
create policy "Members read their contribution research assets" on storage.objects for select to authenticated
using (
  bucket_id = 'contribution-research-assets'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role in ('editor', 'admin'))
  )
);

drop policy if exists "Members remove their contribution research assets" on storage.objects;
create policy "Members remove their contribution research assets" on storage.objects for delete to authenticated
using (
  bucket_id = 'contribution-research-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
);
