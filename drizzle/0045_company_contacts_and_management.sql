PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS company_contact_profiles (
  ticker TEXT PRIMARY KEY NOT NULL REFERENCES companies(ticker) ON DELETE CASCADE,
  legal_name TEXT NOT NULL DEFAULT '',
  street_1 TEXT NOT NULL DEFAULT '',
  street_2 TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  state_or_country TEXT NOT NULL DEFAULT '',
  postal_code TEXT NOT NULL DEFAULT '',
  telephone TEXT NOT NULL DEFAULT '',
  company_website_url TEXT NOT NULL DEFAULT '',
  investor_relations_url TEXT NOT NULL DEFAULT '',
  investor_relations_email TEXT NOT NULL DEFAULT '',
  investor_relations_phone TEXT NOT NULL DEFAULT '',
  sec_source_url TEXT NOT NULL,
  ir_source_url TEXT NOT NULL DEFAULT '',
  verified_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS company_contact_profile_verified_idx
  ON company_contact_profiles(verified_at,ticker);

CREATE TABLE IF NOT EXISTS company_management_people (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticker TEXT NOT NULL REFERENCES companies(ticker) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  biography TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_excerpt TEXT NOT NULL,
  source_filing_date TEXT,
  is_current INTEGER NOT NULL DEFAULT 1,
  verified_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS company_management_ticker_name_title_idx
  ON company_management_people(ticker,name,title);
CREATE INDEX IF NOT EXISTS company_management_current_idx
  ON company_management_people(ticker,is_current,verified_at);

CREATE TABLE IF NOT EXISTS company_profile_refresh_jobs (
  id TEXT PRIMARY KEY NOT NULL,
  ticker TEXT NOT NULL REFERENCES companies(ticker) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'running',
  contact_source_url TEXT NOT NULL DEFAULT '',
  management_source_url TEXT NOT NULL DEFAULT '',
  management_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT NOT NULL DEFAULT '',
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS company_profile_refresh_status_idx
  ON company_profile_refresh_jobs(status,started_at);
CREATE INDEX IF NOT EXISTS company_profile_refresh_ticker_idx
  ON company_profile_refresh_jobs(ticker,completed_at);
