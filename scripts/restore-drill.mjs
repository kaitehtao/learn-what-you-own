import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { run } from "./command.mjs";

const backupDir = path.resolve(process.argv[2] ?? "");
if (!process.argv[2]) throw new Error("Usage: npm run restore:drill -- <backup-directory>");
const d1Only = process.argv.includes("--d1-only");
run("node", ["scripts/verify-backup.mjs", backupDir]);
const localDir = await mkdtemp(path.join(os.tmpdir(), "lwyo-d1-restore-"));
run("npx", ["wrangler", "d1", "execute", "DB", "--config", "dist/server/wrangler.json", "--local", "--persist-to", localDir, "--file", path.join(backupDir, "d1-restore.sql"), "--yes"], { capture: true });
const counts = run("npx", ["wrangler", "d1", "execute", "DB", "--config", "dist/server/wrangler.json", "--local", "--persist-to", localDir, "--command", "SELECT COUNT(*) AS companies FROM companies; SELECT COUNT(*) AS dossiers FROM company_dossiers; SELECT COUNT(*) AS filing_facts FROM filing_facts;", "--json"], { capture: true });
console.log(counts);

if (!d1Only) {
  const supabaseDump = path.join(backupDir, "supabase.sql");
  try {
    await readFile(supabaseDump);
    const drillUrl = process.env.SUPABASE_RESTORE_DRILL_DB_URL;
    if (!drillUrl) throw new Error("Set SUPABASE_RESTORE_DRILL_DB_URL to a disposable non-production database to test the Supabase restore, or pass --d1-only.");
    if (drillUrl.includes("fxmdunpolhqponfchwsz")) throw new Error("Refusing to restore a backup into the production Supabase project.");
    run("psql", [drillUrl, "--set", "ON_ERROR_STOP=1", "--file", supabaseDump]);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}
console.log("Restore drill completed without modifying production.");
