# ADR-0004: Publish official SEC evidence automatically

**Status:** Accepted
**Date:** 2026-08-07
**Deciders:** Learn What You Own founder and product owner

## Context

The filing-freshness monitor detects earnings releases, periodic reports, definitive proxies, and material 8-Ks. Those exact EDGAR accessions and normalized filed facts are objective primary evidence, but the original workflow placed every event into a manual editorial queue. That produced thousands of review packages and delayed factual freshness without improving source integrity. A separate schema drift also caused the monitor to write obsolete `dossier_sources` columns.

## Decision

1. Every supported SEC accession is published automatically as a `dossier_freshness_event` and an exact `dossier_sources` record.
2. Periodic and earnings filings continue to refresh normalized Company Facts automatically.
3. The system records `system:sec-freshness` as the automated publisher and retains accession, timestamps, fact-refresh outcome, and exact source URL.
4. The admin freshness section becomes a read-only operational ledger with a manual “scan now” control, not a per-ticker approval queue.
5. Bull, bear, owner-summary, risk, catalyst, valuation, and other interpretive changes remain separate and require the dossier-completion or editorial workflow.
6. Existing pending SEC filing events are migrated to published evidence without manufacturing an editorial summary.

## Options considered

### Continue manual approval for every filing

Preserves a single gate, but confuses evidence with interpretation and creates an unbounded administrative backlog.

### Automatically publish filings and thesis conclusions

Maximizes speed, but would allow automation to silently change investment judgments.

### Automatically publish evidence; separately moderate interpretation

Keeps dossiers current immediately while preserving the human accountability required for investment conclusions. This is the selected option.

## Consequences

- Filing evidence and filed financial facts become current without administrator action.
- The admin screen measures monitor health, published packages, and failures instead of requesting repetitive approvals.
- Editorial capacity can focus on material thesis changes rather than verifying that an SEC accession exists.
- Automated publication must remain limited to exact regulator evidence and deterministic filed facts; management interpretation and AI synthesis do not inherit this privilege.
