# Applied A-ticker production snapshots

These SQL files preserve the issuer-specific batches and repair used to complete the A-ticker dossier rollout in the authoritative Cloudflare D1 database on 2026-08-06.

The recorded post-write audit reported:

- 310 published A tickers and 0 queued;
- required direct SEC and official company/IR sources for every published A-ticker dossier;
- 0 incomplete published A-ticker dossiers; and
- 0 duplicate ticker or source records.

The files keep their original working names for traceability. Their prefixes collide with committed migrations `0023` through `0031`, so they are not part of the replayable migration lineage and must not be run again without a fresh schema/data audit and an explicit recovery plan.
