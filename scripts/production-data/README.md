# Production data workbench

This directory holds operator-reviewed data snapshots that are intentionally outside the replayable D1 migration lineage.

- `0022_publish_a_batch_armk_arw_expanded.sql` is the expanded source snapshot for the portable migration in `drizzle/`.
- `applied-a-ticker-rollout/` preserves the issuer-specific SQL used to complete and repair the A-ticker production rollout on 2026-08-06. Those files have already been applied to the authoritative D1 database. Their numeric prefixes are historical working names, not available migration sequence numbers.

Never replay an applied snapshot merely because it exists here. Before using any production-data artifact:

1. Compare it with the current production schema and data.
2. Confirm whether it is an applied snapshot or a pending change.
3. For a genuinely new change, assign the next unused migration number in `drizzle/` and make it idempotent where practical.
4. Back up D1, apply deliberately, and run the production verification checks.

The Sites packager includes only Git-tracked files from `drizzle/`; it must not package this workbench.
