# ADR-0003: Evidence-gated benchmark completion

## Status

Accepted — 2026-08-07

## Context

The production research database contains thousands of public-company records at different stages. A source-ingestion worker can establish an SEC filing foundation, but source count alone does not make a complete owner dossier. The active database rule also requires verified claims, distinct research sections, and multiple claim classifications. Editorial standards require a human editor to approve thesis language.

The platform also has legacy TypeScript dossier objects. Extending that static registry would make production coverage depend on a code deployment and would create a second source of truth beside D1.

## Decision

Use a D1-backed completion queue ordered by current market capitalization.

1. A candidate is eligible only when its source-backed dossier has all required narrative fields, valid structured sections, an editorial validation timestamp, and at least the active rule's minimum source count.
2. Creating a batch produces an evidence packet and claim preview. It does not publish claims or change the public quality tier.
3. An editor reviews the preview and either returns it for revision or approves it.
4. Approval verifies that every claim cites an existing dossier source, publishes the claims, runs the universal quality reconciler, and marks the candidate approved only when the dossier becomes `benchmark_complete`.
5. Public company pages read benchmark content from D1 first. The legacy TypeScript registry remains a temporary fallback while old records are normalized.

## Alternatives considered

- **Promote every dossier with five sources.** Rejected because it confuses document availability with completed analysis.
- **Generate and publish thesis prose automatically.** Rejected because it violates the human editorial approval rule and could publish unsupported conclusions.
- **Add 1,761 static TypeScript dossier files.** Rejected because it is not operationally scalable and would preserve competing sources of truth.

## Consequences

- The 183 narrative-ready machine dossiers can be completed rapidly in market-cap batches without weakening the benchmark.
- The remaining machine dossiers stay visible as research foundations until editorial drafting is complete.
- Every promotion has an auditable batch, reviewer, evidence packet, validation result, and timestamp.
- D1 becomes the canonical public dossier store; code-only dossiers can be retired progressively.
