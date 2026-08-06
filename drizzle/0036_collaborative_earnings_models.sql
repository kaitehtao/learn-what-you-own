CREATE TABLE IF NOT EXISTS earnings_model_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  ticker TEXT NOT NULL,
  report_date TEXT NOT NULL,
  fiscal_quarter TEXT NOT NULL DEFAULT '',
  thesis_case TEXT NOT NULL DEFAULT 'base' CHECK(thesis_case IN ('bull','base','bear')),
  confidence INTEGER NOT NULL DEFAULT 3 CHECK(confidence BETWEEN 1 AND 5),
  assumption_note TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL DEFAULT '',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS earnings_model_submission_user_report_idx
  ON earnings_model_submissions(user_id,ticker,report_date);
CREATE INDEX IF NOT EXISTS earnings_model_submission_public_idx
  ON earnings_model_submissions(ticker,report_date,updated_at);

CREATE TABLE IF NOT EXISTS earnings_model_cells (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  ticker TEXT NOT NULL,
  report_date TEXT NOT NULL,
  period_key TEXT NOT NULL CHECK(period_key IN ('report_quarter','next_quarter','current_fy','next_fy')),
  metric_key TEXT NOT NULL CHECK(metric_key IN ('revenue_millions','gross_profit_millions','operating_income_millions','adjusted_ebitda_millions','net_income_millions','diluted_shares_millions','adjusted_eps','operating_cash_flow_millions','capex_millions')),
  value REAL NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS earnings_model_cell_user_metric_idx
  ON earnings_model_cells(user_id,ticker,report_date,period_key,metric_key);
CREATE INDEX IF NOT EXISTS earnings_model_cell_aggregate_idx
  ON earnings_model_cells(ticker,report_date,period_key,metric_key);

CREATE TABLE IF NOT EXISTS earnings_model_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  ticker TEXT NOT NULL,
  report_date TEXT NOT NULL,
  period_key TEXT NOT NULL,
  metric_key TEXT NOT NULL,
  old_value REAL,
  new_value REAL,
  version INTEGER NOT NULL,
  changed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS earnings_model_revision_user_report_idx
  ON earnings_model_revisions(user_id,ticker,report_date,changed_at);
