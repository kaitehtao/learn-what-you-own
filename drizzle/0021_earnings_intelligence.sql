CREATE TABLE IF NOT EXISTS earnings_consensus_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticker TEXT NOT NULL,
  report_date TEXT NOT NULL,
  fiscal_quarter TEXT NOT NULL DEFAULT '',
  snapshot_date TEXT NOT NULL,
  eps_estimate REAL,
  analyst_count INTEGER,
  source_label TEXT NOT NULL,
  source_url TEXT NOT NULL,
  captured_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS earnings_consensus_snapshot_unique_idx ON earnings_consensus_snapshots(ticker, report_date, snapshot_date, source_label);
CREATE INDEX IF NOT EXISTS earnings_consensus_revision_idx ON earnings_consensus_snapshots(ticker, report_date, snapshot_date);

CREATE TABLE IF NOT EXISTS earnings_community_estimates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  ticker TEXT NOT NULL,
  report_date TEXT NOT NULL,
  fiscal_quarter TEXT NOT NULL DEFAULT '',
  eps_estimate REAL,
  revenue_estimate_millions REAL,
  thesis_case TEXT NOT NULL DEFAULT 'base' CHECK(thesis_case IN ('bull','base','bear')),
  confidence INTEGER NOT NULL DEFAULT 3 CHECK(confidence BETWEEN 1 AND 5),
  key_driver TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS earnings_community_user_report_idx ON earnings_community_estimates(user_id, ticker, report_date);
CREATE INDEX IF NOT EXISTS earnings_community_aggregate_idx ON earnings_community_estimates(ticker, report_date, updated_at);

CREATE TABLE IF NOT EXISTS earnings_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticker TEXT NOT NULL,
  report_date TEXT NOT NULL,
  fiscal_quarter TEXT NOT NULL DEFAULT '',
  eps_actual REAL,
  eps_consensus_at_report REAL,
  eps_surprise_percent REAL,
  source_label TEXT NOT NULL,
  source_url TEXT NOT NULL,
  captured_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS earnings_result_report_idx ON earnings_results(ticker, report_date);
CREATE INDEX IF NOT EXISTS earnings_result_date_idx ON earnings_results(report_date, ticker);
