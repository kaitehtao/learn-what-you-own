# Learn What You Own data model

## Authorities

- Cloudflare D1 owns public companies, dossiers, sources, claims, filing facts, freshness events, relationships, public earnings intelligence, quality rules, and ingestion ledgers.
- Supabase owns identity, roles, private member research, watchlists, portfolios, messages, contribution drafts, private earnings-model cells, notifications, and row-level security.
- `research_notebooks` supports public-security notebooks keyed by ticker and private-company notebooks keyed by a private company identity. Private companies never require a placeholder ticker or exchange.
- `private_company_metrics`, `private_company_funding_rounds`, and `private_company_cap_table_entries` store dated operating history and forecasts, stage-by-stage financing and valuation, investors, and fully diluted ownership. Every row is member-owned and protected by RLS.

## Core public entities

- `companies`: one searchable security record with issuer identity, CIK, listing state, index metadata, and sourced market-cap snapshot.
- `company_contact_profiles`: SEC-submission address and telephone plus separately verified company and investor-relations destinations, email, provenance, and verification time.
- `company_management_people`: current executive names, titles, concise biographies, and exact proxy or annual-filing excerpts. A row is published only after its excerpt resolves to the stored source text.
- `company_profile_refresh_jobs`: auditable scheduled contact and management refresh outcomes, including partial profiles and extraction errors.
- `company_dossiers`: publication state, quality tier, versioned content, verification, and timestamps.
- `dossier_sources`: deduplicated exact source URLs and evidence metadata.
- `issuer_filing_source_registry`: editor-verified issuer or regulator source packs for listed companies whose periodic reports are not available through the normal EDGAR submissions feed.
- `dossier_claims`: typed claims with section, status, and source linkage.
- `filing_facts` and `filing_fact_imports`: normalized SEC facts plus import provenance.
- `dossier_freshness_events`: immutable filing detections published automatically as primary evidence, with optional separately moderated interpretation metadata.
- `dossier_source_backfill_batches` and `dossier_source_backfill_items`: auditable scheduling and per-ticker ingestion state.
- `dossier_quality_rules`: the active evidence threshold; completion is computed, never manually asserted.
- `dossier_completion_batches` and `dossier_completion_candidates`: automatic benchmark-validation history and the exception ledger. System validation records the rule, evidence metrics, source resolution, result, and audit identity for each candidate.

## Invariants

Ticker-to-CIK mappings must be verified. Each ticker has one canonical security record with all index memberships attached; a distinct share-class ticker remains a distinct security. Exact source URLs are unique per ticker. Queue delivery is idempotent. Official-regulator fallback sources require an active registry row, HTTPS URL, authority, and verification date. Public dossier evidence never contains private member data. Community drafts cannot modify D1 publication state without editor approval. Live market values and derived multiples always carry an as-of time and source. Benchmark completion is derived from published dossier structure, exact stored sources, and verified claims. A candidate advances only when every threshold in the active `dossier_quality_rules` record passes; failures remain exceptions and cannot be promoted by a client-side control.
