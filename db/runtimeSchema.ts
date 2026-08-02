import { env } from "cloudflare:workers";

let quarterlySchemaPromise: Promise<unknown> | null = null;

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
