-- Structured relationship evidence attached to moderated member contributions.
-- Public graph edges are copied to D1 only after an editor approves them.

alter table public.contributions
  add column if not exists related_company text,
  add column if not exists related_ticker text,
  add column if not exists relationship_direction text,
  add column if not exists relationship_product text,
  add column if not exists relationship_materiality text,
  add column if not exists relationship_evidence_class text,
  add column if not exists relationship_source_type text;

alter table public.contributions
  drop constraint if exists contributions_relationship_direction_check;
alter table public.contributions
  add constraint contributions_relationship_direction_check
  check (relationship_direction is null or relationship_direction in ('supplier_to_company', 'company_to_customer'));

alter table public.contributions
  drop constraint if exists contributions_relationship_materiality_check;
alter table public.contributions
  add constraint contributions_relationship_materiality_check
  check (relationship_materiality is null or relationship_materiality in ('named', 'material', 'strategic', 'unknown'));

alter table public.contributions
  drop constraint if exists contributions_relationship_evidence_class_check;
alter table public.contributions
  add constraint contributions_relationship_evidence_class_check
  check (relationship_evidence_class is null or relationship_evidence_class in ('direct_disclosure', 'corroborated', 'inferred'));

alter table public.contributions
  drop constraint if exists contributions_relationship_source_type_check;
alter table public.contributions
  add constraint contributions_relationship_source_type_check
  check (relationship_source_type is null or relationship_source_type in ('sec', 'company'));

alter table public.contributions
  drop constraint if exists contributions_relationship_fields_check;
alter table public.contributions
  add constraint contributions_relationship_fields_check
  check (
    contribution_type <> 'Supplier / customer relationship'
    or (
      length(trim(coalesce(related_company, ''))) >= 2
      and length(trim(coalesce(relationship_product, ''))) >= 3
      and relationship_direction is not null
      and relationship_source_type is not null
    )
  );
