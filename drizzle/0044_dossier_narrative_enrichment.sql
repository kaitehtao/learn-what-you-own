CREATE TABLE IF NOT EXISTS dossier_narrative_enrichment_jobs (
  id TEXT PRIMARY KEY NOT NULL,
  ticker TEXT NOT NULL REFERENCES companies(ticker) ON DELETE CASCADE,
  priority_market_cap REAL,
  status TEXT NOT NULL DEFAULT 'running',
  model TEXT NOT NULL,
  source_urls_json TEXT NOT NULL DEFAULT '[]',
  output_json TEXT NOT NULL DEFAULT '{}',
  validation_json TEXT NOT NULL DEFAULT '{}',
  error_message TEXT NOT NULL DEFAULT '',
  attempt_count INTEGER NOT NULL DEFAULT 1,
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS dossier_narrative_enrichment_status_idx
  ON dossier_narrative_enrichment_jobs(status, started_at);

CREATE INDEX IF NOT EXISTS dossier_narrative_enrichment_ticker_idx
  ON dossier_narrative_enrichment_jobs(ticker, completed_at);
