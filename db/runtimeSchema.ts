import { env } from "cloudflare:workers";

let quarterlySchemaPromise: Promise<unknown> | null = null;
let feedbackVotingSchemaPromise: Promise<unknown> | null = null;
let memberRewardsSchemaPromise: Promise<unknown> | null = null;
let professionalInterviewsSchemaPromise: Promise<unknown> | null = null;
let brokerageClickSchemaPromise: Promise<unknown> | null = null;
let insiderActivitySchemaPromise: Promise<unknown> | null = null;
let earningsIntelligenceSchemaPromise: Promise<unknown> | null = null;

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

export function ensureProfessionalInterviewsSchema() {
  if (!env.DB) throw new Error("Cloudflare D1 binding `DB` is unavailable.");
  if (!professionalInterviewsSchemaPromise) {
    professionalInterviewsSchemaPromise = env.DB.batch([
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS professional_interviews (
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
      )`),
      env.DB.prepare("CREATE INDEX IF NOT EXISTS professional_interview_public_idx ON professional_interviews(status,created_at)"),
      env.DB.prepare("CREATE INDEX IF NOT EXISTS professional_interview_user_idx ON professional_interviews(user_id,created_at)"),
    ]).catch((error) => {
      professionalInterviewsSchemaPromise = null;
      throw error;
    });
  }
  return professionalInterviewsSchemaPromise;
}

export function ensureBrokerageClickSchema() {
  if (!env.DB) throw new Error("Cloudflare D1 binding `DB` is unavailable.");
  if (!brokerageClickSchemaPromise) {
    brokerageClickSchemaPromise = env.DB.batch([
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS brokerage_clicks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        click_id TEXT NOT NULL,
        broker_key TEXT NOT NULL,
        action TEXT NOT NULL CHECK(action IN ('login','open')),
        destination_type TEXT NOT NULL DEFAULT 'official' CHECK(destination_type IN ('official','paid_referral')),
        source_path TEXT NOT NULL DEFAULT '/portfolio',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`),
      env.DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS brokerage_click_id_idx ON brokerage_clicks(click_id)"),
      env.DB.prepare("CREATE INDEX IF NOT EXISTS brokerage_click_broker_created_idx ON brokerage_clicks(broker_key,created_at)"),
      env.DB.prepare("CREATE INDEX IF NOT EXISTS brokerage_click_action_created_idx ON brokerage_clicks(action,created_at)"),
    ]).catch((error) => {
      brokerageClickSchemaPromise = null;
      throw error;
    });
  }
  return brokerageClickSchemaPromise;
}

export function ensureInsiderActivitySchema() {
  if (!env.DB) throw new Error("Cloudflare D1 binding `DB` is unavailable.");
  if (!insiderActivitySchemaPromise) {
    insiderActivitySchemaPromise = env.DB.batch([
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS sec_insider_transactions (
        id TEXT PRIMARY KEY,
        ticker TEXT NOT NULL,
        company_name TEXT NOT NULL,
        cik TEXT NOT NULL,
        accession_number TEXT NOT NULL,
        form TEXT NOT NULL,
        filing_date TEXT NOT NULL,
        transaction_date TEXT NOT NULL,
        insider_name TEXT NOT NULL,
        insider_relation TEXT NOT NULL,
        transaction_code TEXT NOT NULL,
        direction TEXT NOT NULL CHECK(direction IN ('purchase','sale')),
        transaction_type TEXT NOT NULL,
        security_title TEXT NOT NULL,
        shares REAL NOT NULL,
        price REAL,
        reported_value REAL,
        shares_held REAL,
        direct_or_indirect TEXT NOT NULL DEFAULT '',
        source_url TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`),
      env.DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS sec_insider_accession_transaction_idx ON sec_insider_transactions(accession_number,id)"),
      env.DB.prepare("CREATE INDEX IF NOT EXISTS sec_insider_direction_date_idx ON sec_insider_transactions(direction,transaction_date)"),
      env.DB.prepare("CREATE INDEX IF NOT EXISTS sec_insider_ticker_date_idx ON sec_insider_transactions(ticker,transaction_date)"),
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS sec_ownership_index_imports (
        index_date TEXT PRIMARY KEY,
        status TEXT NOT NULL DEFAULT 'pending',
        next_offset INTEGER NOT NULL DEFAULT 0,
        total_filings INTEGER NOT NULL DEFAULT 0,
        imported_transactions INTEGER NOT NULL DEFAULT 0,
        failed_filings INTEGER NOT NULL DEFAULT 0,
        index_url TEXT NOT NULL DEFAULT '',
        last_attempted_at TEXT,
        last_success_at TEXT,
        last_error TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`),
      env.DB.prepare("CREATE INDEX IF NOT EXISTS sec_ownership_import_status_date_idx ON sec_ownership_index_imports(status,index_date)"),
    ]).catch((error) => {
      insiderActivitySchemaPromise = null;
      throw error;
    });
  }
  return insiderActivitySchemaPromise;
}

export function ensureEarningsIntelligenceSchema() {
  if (!env.DB) throw new Error("Cloudflare D1 binding `DB` is unavailable.");
  if (!earningsIntelligenceSchemaPromise) {
    earningsIntelligenceSchemaPromise = env.DB.batch([
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS earnings_consensus_snapshots (
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
      )`),
      env.DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS earnings_consensus_snapshot_unique_idx ON earnings_consensus_snapshots(ticker,report_date,snapshot_date,source_label)"),
      env.DB.prepare("CREATE INDEX IF NOT EXISTS earnings_consensus_revision_idx ON earnings_consensus_snapshots(ticker,report_date,snapshot_date)"),
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS earnings_community_estimates (
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
      )`),
      env.DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS earnings_community_user_report_idx ON earnings_community_estimates(user_id,ticker,report_date)"),
      env.DB.prepare("CREATE INDEX IF NOT EXISTS earnings_community_aggregate_idx ON earnings_community_estimates(ticker,report_date,updated_at)"),
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS earnings_results (
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
      )`),
      env.DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS earnings_result_report_idx ON earnings_results(ticker,report_date)"),
      env.DB.prepare("CREATE INDEX IF NOT EXISTS earnings_result_date_idx ON earnings_results(report_date,ticker)"),
    ]).catch((error) => {
      earningsIntelligenceSchemaPromise = null;
      throw error;
    });
  }
  return earningsIntelligenceSchemaPromise;
}
