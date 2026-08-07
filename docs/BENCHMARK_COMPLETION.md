# Benchmark completion operations

The benchmark-completion queue is the editorial bridge between an SEC-backed research foundation and a fully published owner dossier.

## Eligibility

A machine-enriched dossier may enter the queue when it has:

- at least the active quality rule's minimum source count;
- an editor-validated narrative;
- complete owner summary, business model, revenue model, opportunity, owner requirements, and thesis breaker;
- valid bull, bear, financial-driver, risk, monitor, and question JSON sections.

Candidates are ranked by current `companies.market_cap` descending. No ticker allowlist controls completion.

## Review flow

1. An editor creates the next batch in `/admin#dossier-completion`.
2. The system builds ten claim previews across ten research sections from the validated narrative and exact stored sources.
3. The editor inspects the claims and source links.
4. `Return for revision` records the reason without changing public research.
5. `Approve benchmark normalization` publishes the claims and runs the active universal quality rule.
6. The candidate is approved only if the database reports `benchmark_complete`.

Source ingestion and editorial completion remain separate queues. A filing worker can add evidence automatically; it cannot approve an investment thesis.
