CREATE TABLE IF NOT EXISTS dossier_completion_batches (
  id TEXT PRIMARY KEY NOT NULL,
  universe_name TEXT NOT NULL,
  selection_rule TEXT NOT NULL,
  requested_count INTEGER NOT NULL,
  selected_count INTEGER NOT NULL DEFAULT 0,
  approved_count INTEGER NOT NULL DEFAULT 0,
  needs_revision_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'editorial_review',
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS dossier_completion_batch_status_idx
  ON dossier_completion_batches(status, created_at);

CREATE TABLE IF NOT EXISTS dossier_completion_candidates (
  batch_id TEXT NOT NULL REFERENCES dossier_completion_batches(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL REFERENCES companies(ticker) ON DELETE CASCADE,
  priority_rank INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'evidence_packet_ready',
  source_count INTEGER NOT NULL,
  claim_preview_json TEXT NOT NULL,
  validation_json TEXT NOT NULL DEFAULT '{}',
  review_note TEXT NOT NULL DEFAULT '',
  reviewed_by TEXT,
  reviewed_at TEXT,
  approved_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(batch_id, ticker)
);

CREATE INDEX IF NOT EXISTS dossier_completion_candidate_status_idx
  ON dossier_completion_candidates(status, priority_rank);

CREATE INDEX IF NOT EXISTS dossier_completion_candidate_ticker_idx
  ON dossier_completion_candidates(ticker, created_at);
