# ADR-0001: Durable SEC source backfill for the Russell universes

**Status:** Accepted

**Date:** 2026-08-06
**Decider:** LearnWhatYouOwn founder/editor

**Updated by:** ADR-0006 expands selection to the deduplicated Russell 3000 and Nasdaq-100 union and adds verified regulator-source fallbacks.

## Context

Russell 2000 and Russell 3000 discovery records substantially outnumber dossiers with primary-source evidence. The existing scheduled filing monitor keeps published dossiers fresh, but it does not create the initial SEC evidence foundation for zero-source companies. A one-time ticker list or generated SQL snapshot would drift and would not provide retry, audit, or batch history.

## Decision

Add a database-driven backfill worker that selects active Russell 3000 constituents with zero dossier sources in descending market-cap order. Each bounded batch will create a machine-enriched dossier record, retrieve the issuer's SEC submissions feed, store exact EDGAR accession links for a balanced recent filing pack, import normalized Company Facts when available, establish the future-filing baseline, and record per-ticker outcomes in a durable batch ledger.

Russell 2000 membership is stored on each batch item, so the single deduplicated Russell 3000 pass covers the Russell 2000 subset without duplicate SEC traffic. Automated evidence ingestion does not label a dossier benchmark complete; the existing quality rule and editorial review remain authoritative.

## Options considered

### One-time SQL snapshots

Low implementation complexity, but no live source retrieval, retry behavior, provenance audit, or protection against constituent drift. Rejected.

### Automatically publish AI-generated complete dossiers

Fast in appearance, but it can invent interpretations, weaken claim-level provenance, create uncontrolled model cost, and bypass editorial accountability. Rejected.

### Bounded SEC backfill with editorial completion

Moderate implementation complexity. It is resumable, source-grounded, rate-conscious, observable, and compatible with the current D1 and Cloudflare Worker architecture. Accepted.

## Consequences

- Zero-source coverage can advance continuously without hard-coded ticker batches.
- Every completed source-foundation batch exposes its exact ticker list and outcomes.
- Foreign issuers and companies without compatible SEC facts remain explicit rather than receiving fabricated data.
- Machine-enriched dossiers still require verified claims and balanced editorial analysis before becoming benchmark complete.
- SEC request volume stays bounded and retryable.

## Rollback

Disable the scheduled backfill call and redeploy the prior Worker version. The batch ledger and imported source rows are additive and retain provenance; they do not overwrite editorial claims or thesis prose.
