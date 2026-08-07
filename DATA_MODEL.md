# Learn What You Own data model

## Authorities

- Cloudflare D1 owns public companies, dossiers, sources, claims, filing facts, freshness events, relationships, public earnings intelligence, quality rules, and ingestion ledgers.
- Supabase owns identity, roles, private member research, watchlists, portfolios, messages, contribution drafts, private earnings-model cells, notifications, and row-level security.

## Core public entities

- `companies`: one searchable security record with issuer identity, CIK, listing state, index metadata, and sourced market-cap snapshot.
- `company_dossiers`: publication state, quality tier, versioned content, verification, and timestamps.
- `dossier_sources`: deduplicated exact source URLs and evidence metadata.
- `dossier_claims`: typed claims with section, status, and source linkage.
- `filing_facts` and `filing_fact_imports`: normalized SEC facts plus import provenance.
- `dossier_freshness_events`: immutable filing detections published automatically as primary evidence, with optional separately moderated interpretation metadata.
- `dossier_source_backfill_batches` and `dossier_source_backfill_items`: auditable scheduling and per-ticker ingestion state.
- `dossier_quality_rules`: the active evidence threshold; completion is computed, never manually asserted.

## Invariants

Ticker-to-CIK mappings must be verified. Exact source URLs are unique per ticker. Queue delivery is idempotent. Public dossier evidence never contains private member data. Community drafts cannot modify D1 publication state without editor approval. Live market values and derived multiples always carry an as-of time and source.
