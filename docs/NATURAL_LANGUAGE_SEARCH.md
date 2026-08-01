# Evidence-aware natural-language search

## Product promise

Search should help an owner find the company, fact, relationship, filing, person, or community insight that answers a research question. Exact ticker and company matches must remain fast and deterministic. Natural-language results must preserve the distinction between filed facts, company statements, editorial analysis, and community opinion.

The first release should retrieve evidence-linked records. It should not generate an uncited narrative answer. Answer synthesis can follow only after retrieval quality and citation coverage pass the acceptance tests below.

## Searchable public records

| Result type | Authoritative source | Searchable text | Required result context |
| --- | --- | --- | --- |
| Company | D1 `companies` and `company_dossiers` | ticker, legal/common name, sector, exchange, memberships | dossier status |
| Dossier claim | D1 `dossier_claims` | claim, why it matters, section, source excerpt | claim class, evidence date, primary-source link |
| Supplier/customer relationship | D1 `company_relationships` | both organizations, product/service, evidence summary | relationship direction, evidence class, source link |
| Filing | D1 `dossier_sources` and `filing_facts` | filing title/type plus normalized fact labels | form, filing date, reporting period, SEC link |
| Executive | new D1 `company_people` records | person, role, company, biography summary | tenure dates and SEC/company source |
| Community insight | approved Supabase `contributions`, copied to the public search read model during moderation | claim, why it matters, expertise and ticker | username, disclosure, moderation state, source link |
| Public member post | Supabase public messages, copied only when visibility is public | subject and body | clearly labeled unverified community discussion |

Private messages must never be indexed. Private notebook search remains an authenticated, user-scoped Supabase feature and must not share a public search index.

## Recommended architecture

Keep D1 as the authoritative public-research database and add a derived `search_documents` read model. Every row points back to one authoritative record; it does not become a second copy of truth.

Suggested fields:

- `id` and stable `document_key`
- `entity_type` (`company`, `claim`, `relationship`, `filing`, `executive`, `community_insight`, `public_post`)
- `ticker`, `title`, `body`, and normalized aliases
- `source_type`, `source_url`, `evidence_date`, and `evidence_class`
- `authoritative_table` and `authoritative_id`
- `visibility`, `status`, `content_hash`, and `updated_at`

Use three retrieval lanes and merge their ranked results:

1. **Exact lane:** existing ticker/company matching. Exact ticker navigation always wins.
2. **Keyword lane:** an FTS5 index over published D1 `search_documents`, with boosts for ticker, company, person, relationship endpoints, and filing form.
3. **Semantic lane:** embeddings for the same public documents in Cloudflare Vectorize. Store only identifiers and short filter metadata in the vector index; fetch the final record and evidence from D1.

Merge keyword and semantic ranks with reciprocal-rank fusion. Apply explicit boosts in this order: exact ticker/company, primary-source fact, direct relationship disclosure, approved community insight, unverified public post. Semantic similarity must never promote a draft, private, rejected, or unpublished record.

Cloudflare D1 supports SQLite FTS5. Vectorize supports metadata filtering, so the semantic query can be limited by ticker, entity type, evidence class, or date before ranking. This keeps the public search path next to the production Worker and authoritative D1 rather than moving public dossier ownership into Supabase.

## Query interpretation

The `/api/search` route should return a structured interpretation alongside grouped results:

- detected ticker/company aliases;
- requested entities such as suppliers, customers, executives, filings, or community insights;
- time or form constraints such as “latest 10-K”;
- remaining semantic query text;
- spelling correction offered, never silently substituted for an exact ticker.

Examples:

| Query | Interpretation | Preferred result |
| --- | --- | --- |
| `AAPL` | exact ticker | Apple dossier |
| `Apple suppliers` | company + supplier relationship | sourced relationship edges into Apple |
| `who buys NVIDIA chips` | company + customer relationship | sourced edges out of NVIDIA and relevant claims |
| `NVIDIA CEO` | company + executive | current executive record with official source |
| `latest Boeing 10-K risks` | company + filing form + section + recency | SEC filing and published risk claims |
| `community thesis on Apple margins` | company + approved community content + topic | moderated insights, followed by labeled public discussion |

Search results should be grouped by Company, Facts and filings, Relationships, People, and Community. Each non-company result must show why it matched, its evidence classification, date, and clickable source.

## Indexing workflow

- Rebuild a document when its authoritative record changes; use `content_hash` to make jobs idempotent.
- Add or remove public community documents inside the existing approval/rejection workflow.
- Embed only records already eligible for public display.
- Delete the corresponding FTS/vector document when a record is unpublished or superseded.
- Run a scheduled reconciliation that compares authoritative published IDs with both indexes and reports missing, stale, orphaned, and duplicate documents.
- Keep the embedding model and version on every indexed document so a model change can be reindexed safely.

## Delivery phases

### Phase 1 — unified keyword search

- Add `company_people`, `search_documents`, and the FTS index in D1.
- Backfill published companies, claims, sources, facts, and relationships.
- Copy approved public contributions into the read model during moderation.
- Add `/api/search` and a full `/search` results page with grouped filters.
- Keep the homepage eight-result typeahead for companies; send longer questions to `/search`.

### Phase 2 — semantic retrieval

- Add the Vectorize binding and one versioned embedding pipeline.
- Parse entity/type/date constraints before semantic retrieval.
- Fuse exact, FTS, and vector results and measure relevance against the evaluation set.

### Phase 3 — cited answer mode

- Generate a short answer only from retrieved records.
- Cite every factual sentence to the underlying SEC, company/IR, or clearly labeled community record.
- Show “insufficient verified evidence” when retrieval cannot support an answer.

### Phase 4 — private research search

- Add a separate authenticated Supabase hybrid-search path for the signed-in user’s notebooks if needed.
- Enforce row-level security before retrieval and never place notebooks or private messages in the public D1/Vectorize index.

## Acceptance tests

- `AAPL` returns Apple first and opens the dossier in one action.
- `Apple suppliers` returns sourced supplier/customer records, not merely pages containing the word “supplier.”
- `NVIDIA CEO` returns a current, officially sourced executive record.
- Filing results expose form, reporting period, filing date, and direct SEC link.
- Community results distinguish moderated insight from unverified public discussion.
- Every factual result has a source URL and evidence label.
- Draft, rejected, unpublished, and private records never appear publicly.
- A user cannot retrieve another user’s notebook or any private message through search.
- Index reconciliation reports zero missing published records, zero orphaned records, and zero duplicate document keys.

## Privacy-conscious popularity

Replace hard-coded “popular” terms only after search analytics exist. Record aggregate result selections and normalized entity/type counters, not a permanent log of raw user questions. Publish “Most researched” tickers from a rolling window only after applying a minimum-count threshold; this avoids exposing a single member’s research activity.
