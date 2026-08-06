CREATE TABLE IF NOT EXISTS dossier_source_backfill_batches (
  id TEXT PRIMARY KEY NOT NULL,
  universe_name TEXT NOT NULL,
  selection_rule TEXT NOT NULL,
  requested_limit INTEGER NOT NULL,
  selected_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  source_count_added INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'running',
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS dossier_source_backfill_batch_status_idx
ON dossier_source_backfill_batches(status,started_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS dossier_source_backfill_items (
  batch_id TEXT NOT NULL REFERENCES dossier_source_backfill_batches(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL REFERENCES companies(ticker) ON DELETE CASCADE,
  priority_rank INTEGER NOT NULL,
  memberships_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'running',
  source_count_before INTEGER NOT NULL DEFAULT 0,
  source_count_after INTEGER NOT NULL DEFAULT 0,
  facts_import_status TEXT NOT NULL DEFAULT 'not_attempted',
  facts_import_detail TEXT NOT NULL DEFAULT '',
  error_message TEXT NOT NULL DEFAULT '',
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  PRIMARY KEY(batch_id,ticker)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS dossier_source_backfill_item_ticker_idx
ON dossier_source_backfill_items(ticker,completed_at);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS dossier_source_backfill_item_status_idx
ON dossier_source_backfill_items(status,completed_at);
