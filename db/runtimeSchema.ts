import { env } from "cloudflare:workers";

let quarterlySchemaPromise: Promise<unknown> | null = null;
let feedbackVotingSchemaPromise: Promise<unknown> | null = null;
let memberRewardsSchemaPromise: Promise<unknown> | null = null;

// Manual migrations are packaged with the worker, but an older production D1
// database can briefly receive new application code before the migration is
// applied. Keep the optional quarterly-review layer from taking the entire
// public research dossier offline during that window.
export function ensureQuarterlyDossierUpdatesSchema() {
  if (!env.DB) throw new Error("Cloudflare D1 binding `DB` is unavailable.");
  if (!quarterlySchemaPromise) {
    quarterlySchemaPromise = env.DB.batch([
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS quarterly_dossier_updates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticker TEXT NOT NULL REFERENCES company_dossiers(ticker) ON DELETE CASCADE,
        accession_number TEXT NOT NULL,
        form TEXT NOT NULL,
        period_end TEXT NOT NULL,
        filed_at TEXT NOT NULL,
        source_url TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'facts_refreshed',
        editorial_summary TEXT NOT NULL DEFAULT '',
        reviewed_by TEXT,
        reviewed_at TEXT,
        published_at TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`),
      env.DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS quarterly_dossier_update_accession_idx ON quarterly_dossier_updates(ticker, accession_number)"),
      env.DB.prepare("CREATE INDEX IF NOT EXISTS quarterly_dossier_update_public_idx ON quarterly_dossier_updates(ticker, filed_at)"),
      env.DB.prepare("CREATE INDEX IF NOT EXISTS quarterly_dossier_update_review_idx ON quarterly_dossier_updates(status, filed_at)"),
    ]).catch((error) => {
      quarterlySchemaPromise = null;
      throw error;
    });
  }
  return quarterlySchemaPromise;
}

export function ensureFeedbackVotingSchema() {
  if (!env.DB) throw new Error("Cloudflare D1 binding `DB` is unavailable.");
  if (!feedbackVotingSchemaPromise) {
    feedbackVotingSchemaPromise = env.DB.batch([
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS product_feedback_votes (
        feedback_id INTEGER NOT NULL REFERENCES product_feedback(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`),
      env.DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS product_feedback_vote_unique_idx ON product_feedback_votes(feedback_id, user_id)"),
      env.DB.prepare("CREATE INDEX IF NOT EXISTS product_feedback_vote_rank_idx ON product_feedback_votes(feedback_id, created_at)"),
    ]).catch((error) => {
      feedbackVotingSchemaPromise = null;
      throw error;
    });
  }
  return feedbackVotingSchemaPromise;
}

export function ensureMemberRewardsSchema() {
  if (!env.DB) throw new Error("Cloudflare D1 binding `DB` is unavailable.");
  if (!memberRewardsSchemaPromise) {
    memberRewardsSchemaPromise = env.DB.batch([
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS member_reward_ledger (
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
      )`),
      env.DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS member_reward_source_unique_idx ON member_reward_ledger(user_id,event_type,source_type,source_id)"),
      env.DB.prepare("CREATE INDEX IF NOT EXISTS member_reward_user_created_idx ON member_reward_ledger(user_id,created_at)"),
      env.DB.prepare("CREATE INDEX IF NOT EXISTS member_reward_username_idx ON member_reward_ledger(username)"),
    ]).catch((error) => {
      memberRewardsSchemaPromise = null;
      throw error;
    });
  }
  return memberRewardsSchemaPromise;
}
