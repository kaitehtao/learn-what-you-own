# ADR-0005: Complete benchmark dossiers through an automatic evidence gate

**Status:** Accepted
**Date:** 2026-08-07
**Deciders:** Learn What You Own founder and product owner

## Context

The benchmark-completion workflow generated source-backed claim packets but required an administrator to approve every ticker. That duplicated deterministic checks already encoded in `dossier_quality_rules`, created an avoidable backlog, and made completion depend on repetitive button clicks rather than evidence quality.

## Decision

1. A scheduled validator prepares and evaluates bounded batches of narrative-ready dossiers.
2. A dossier receives benchmark-complete status only when the active rule passes all required narrative, source-depth, verified-claim, section-diversity, claim-type-diversity, and exact-citation checks.
3. Passing claims are published with the auditable system identity `system:evidence-benchmark`; there is no per-ticker approval step.
4. Failures remain `needs_revision` in an administrator exception ledger and do not receive benchmark-complete status.
5. The validator does not repeatedly requeue the same exception automatically.
6. Community submissions, corrections, rights-sensitive content, and later investment-interpretation changes remain moderated.
7. New SEC evidence continues to publish automatically under ADR-0004, but it does not silently rewrite an existing bull, bear, valuation, or owner-summary conclusion.

## Consequences

- Benchmark throughput is bounded by evidence availability and scheduled capacity rather than administrator clicks.
- Completion remains reproducible from stored sources, claims, the active rule, and an audit identity.
- The admin interface becomes an operational history and exception surface.
- Benchmark status indicates that the dossier passed the declared evidence structure; it is not a guarantee that an investment thesis is correct.
