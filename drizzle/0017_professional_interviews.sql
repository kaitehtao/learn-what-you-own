CREATE TABLE IF NOT EXISTS professional_interviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  guest_name TEXT NOT NULL,
  guest_title TEXT NOT NULL,
  firm TEXT NOT NULL DEFAULT '',
  credentials TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  topics_json TEXT NOT NULL DEFAULT '[]',
  interview_url TEXT NOT NULL,
  transcript_url TEXT NOT NULL DEFAULT '',
  disclosure TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted',
  moderator_note TEXT NOT NULL DEFAULT '',
  moderated_by TEXT,
  moderated_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS professional_interview_public_idx
  ON professional_interviews(status,created_at);
CREATE INDEX IF NOT EXISTS professional_interview_user_idx
  ON professional_interviews(user_id,created_at);
