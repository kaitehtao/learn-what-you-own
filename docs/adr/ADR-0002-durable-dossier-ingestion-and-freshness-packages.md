# ADR-0002: Durable dossier ingestion and filing review packages

Status: accepted  
Date: 2026-08-06

## Context

The original Russell source backfill performed as many as 12 SEC submission and Company Facts imports sequentially inside one scheduled HTTP request. Overlapping cron invocations could select different work while earlier requests remained active, an upstream SEC request had no deadline, and a starting dossier was marked public before its evidence was fetched. Filing freshness detection was reliable, but each accession appeared as a separate editorial task and produced a 2,551-event review backlog.

## Decision

1. The five-minute scheduler acquires a short D1 selection lease, creates an auditable batch ledger, and sends one message per ticker to `lwyo-dossier-ingestion`.
2. The Worker consumes one message per batch with concurrency capped at two. SEC JSON calls use an eight-second timeout and three bounded attempts. Queue delivery adds exponential retry delay, five terminal attempts, and `lwyo-dossier-ingestion-dlq` for unhandled failures.
3. Message processing is idempotent. Exact filing URLs remain protected by the existing ticker-and-URL uniqueness constraint, and duplicate Queue delivery exits when the D1 item is already terminal.
4. A starting dossier stays `queued`. It becomes `published` and `machine_enriched` only after at least five distinct dossier sources exist. Benchmark completion continues to require the active claims, sections, evidence-class, and source rule.
5. Freshness events remain immutable evidence records. The admin interface groups pending events by company and report period, prioritizes earnings and periodic reports, and lets an editor publish or dismiss the complete package. Automation does not rewrite a thesis or silently discard filings.

## Consequences

- Scheduled requests become short and cannot overlap candidate selection.
- A slow or unavailable SEC endpoint affects one ticker job rather than a whole batch.
- Queue and D1 metrics expose pending, running, completed, and terminal-failure counts.
- Production requires both queues and the tracked D1 reliability migration before the new Worker is deployed.
- The raw freshness backlog remains auditable, while the operator works a much smaller set of reporting-period packages.
