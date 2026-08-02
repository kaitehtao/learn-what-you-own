CREATE TABLE IF NOT EXISTS member_reward_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  event_type TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  points INTEGER NOT NULL,
  description TEXT NOT NULL,
  awarded_by TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS member_reward_source_unique_idx
  ON member_reward_ledger(user_id,event_type,source_type,source_id);
CREATE INDEX IF NOT EXISTS member_reward_user_created_idx
  ON member_reward_ledger(user_id,created_at);
CREATE INDEX IF NOT EXISTS member_reward_username_idx
  ON member_reward_ledger(username);
