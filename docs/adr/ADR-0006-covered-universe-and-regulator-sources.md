# ADR-0006: Deduplicated covered-universe ingestion and regulator sources

**Status:** Accepted

**Date:** 2026-08-08
**Decider:** LearnWhatYouOwn founder/editor

## Context

The source-foundation worker selected Russell 3000 constituents only. Nasdaq-100 securities outside that universe therefore remained at zero sources even when their SEC feeds contained suitable filings. A smaller exception involved exchange-listed banks that file periodic Exchange Act reports with the FDIC rather than EDGAR; treating those issuers as missing evidence was inaccurate.

## Decision

1. Select the union of active Russell 3000 and Nasdaq-100 constituents, deduplicated by ticker and ranked by current market capitalization.
2. Preserve every index-membership label on the single batch item and canonical security record.
3. Continue to prefer exact SEC filing URLs whenever the SEC submissions feed contains a supported source pack.
4. When EDGAR has no supported periodic reports, consult `issuer_filing_source_registry` for an active, editor-verified pack from the issuer or applicable regulator.
5. Permit only source types already accepted by the public evidence schema and require HTTPS URLs, authority metadata, and a verification date.
6. Apply the same five-source publication gate regardless of whether the source pack came from EDGAR or an official regulator/issuer archive.
7. Do not infer benchmark completion from index membership or source availability; narrative and claim checks remain separate.

## Consequences

- Membership in several indices does not duplicate a ticker, dossier, source, or claim.
- Nasdaq-100-only constituents enter the same durable source workflow.
- Non-EDGAR reporting exceptions become configurable database records instead of hard-coded application branches.
- The registry requires periodic verification when an issuer changes its archive URLs.

## Rollback

Redeploy the prior Worker to restore the Russell-only selector. Set registry rows to `active=0` to disable a fallback without deleting provenance. Existing sources remain additive and auditable.
