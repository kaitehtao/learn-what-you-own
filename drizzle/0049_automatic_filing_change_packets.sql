ALTER TABLE quarterly_dossier_updates ADD COLUMN objective_summary TEXT NOT NULL DEFAULT '';
ALTER TABLE quarterly_dossier_updates ADD COLUMN comparisons_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE quarterly_dossier_updates ADD COLUMN comparison_basis TEXT NOT NULL DEFAULT '';
ALTER TABLE quarterly_dossier_updates ADD COLUMN comparison_generated_at TEXT;

CREATE INDEX IF NOT EXISTS quarterly_dossier_update_comparison_idx
  ON quarterly_dossier_updates(comparison_generated_at, filed_at);
