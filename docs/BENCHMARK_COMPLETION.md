# Benchmark completion operations

The benchmark-completion queue is the auditable evidence bridge between an SEC-backed research foundation and a fully published owner dossier.

## Eligibility

A machine-enriched dossier may enter the queue when it has:

- at least the active quality rule's minimum source count;
- a validated structured narrative;
- complete owner summary, business model, revenue model, opportunity, owner requirements, and thesis breaker;
- valid bull, bear, financial-driver, risk, monitor, and question JSON sections.

Candidates are ranked by current `companies.market_cap` descending. No ticker allowlist controls completion.

## Automatic flow

1. The scheduled process takes any already validated narrative-ready dossiers in current market-cap order.
2. When none are ready, it selects one `machine_enriched` dossier by current market capitalization descending.
3. It reads exact stored SEC filings and requests a bounded structured draft through the Cloudflare Workers AI binding.
4. Every narrative element must cite one of the exact input filing URLs; the source pack, model output, and validation result are retained in `dossier_narrative_enrichment_jobs`.
5. The public dossier labels the narrative AI-assisted. The system builds ten claims across ten research sections from the resolved citations.
6. The active deterministic quality rule checks claim count, section diversity, claim-type diversity, source depth, and exact citation resolution.
7. Only a passing candidate is published as `benchmark_complete`; failures remain audited exceptions.

Source ingestion and narrative enrichment remain separate stages. Newly detected filings may refresh evidence automatically but cannot silently rewrite an already published investment thesis.
