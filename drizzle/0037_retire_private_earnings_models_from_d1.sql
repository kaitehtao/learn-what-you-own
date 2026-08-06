-- Private member model cells belong in Supabase under row-level security.
-- These D1 tables were introduced empty during pre-release validation and are
-- removed before the feature ships; D1 retains Street snapshots and results.
DROP TABLE IF EXISTS earnings_model_revisions;
DROP TABLE IF EXISTS earnings_model_cells;
DROP TABLE IF EXISTS earnings_model_submissions;
