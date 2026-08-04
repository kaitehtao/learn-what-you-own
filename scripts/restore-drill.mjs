import { access, mkdtemp, readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
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

async function psqlBinary() {
  for (const candidate of [process.env.PSQL_PATH, "/opt/homebrew/opt/libpq/bin/psql", "psql"].filter(Boolean)) {
    if (candidate.includes("/")) {
      try { await access(candidate); } catch { continue; }
    }
    const check = spawnSync(candidate, ["--version"], { encoding: "utf8" });
    if (check.status === 0) return candidate;
  }
  throw new Error("psql is required for a URL-based Supabase restore drill.");
}

function assertSupabaseCounts(expected, actual) {
  for (const relation of ["auth.users", "public.profiles", "storage.buckets", "storage.objects"]) {
    if (Number(actual[relation]) !== Number(expected[relation])) {
      throw new Error(`Supabase restore count mismatch for ${relation}: expected ${expected[relation]}, received ${actual[relation]}.`);
    }
  }
}

const countQuery = `select json_build_object(
  'auth.users', (select count(*) from auth.users),
  'public.profiles', (select count(*) from public.profiles),
  'storage.buckets', (select count(*) from storage.buckets),
  'storage.objects', (select count(*) from storage.objects)
)::text;`;

if (!d1Only) {
  const supabaseDump = path.join(backupDir, "supabase.sql");
  try {
    await readFile(supabaseDump);
    const expectedCounts = JSON.parse(await readFile(path.join(backupDir, "supabase-counts.json"), "utf8"));
    const drillContainer = process.env.SUPABASE_RESTORE_DRILL_CONTAINER;
    const drillUrl = process.env.SUPABASE_RESTORE_DRILL_DB_URL;
    if (!drillContainer && !drillUrl) throw new Error("Set SUPABASE_RESTORE_DRILL_CONTAINER or SUPABASE_RESTORE_DRILL_DB_URL to a disposable non-production database, or pass --d1-only.");
    if (drillContainer) {
      if (!drillContainer.startsWith("supabase_db_")) throw new Error("Refusing to restore into a container that is not a local Supabase database.");
      const localAdmin = "supabase_admin";
      run("docker", ["exec", drillContainer, "psql", "-U", localAdmin, "-d", "postgres", "--set", "ON_ERROR_STOP=1", "--command", "DROP SCHEMA IF EXISTS auth CASCADE; DROP SCHEMA IF EXISTS storage CASCADE; DROP SCHEMA IF EXISTS public CASCADE;"]);
      run("docker", ["cp", supabaseDump, `${drillContainer}:/tmp/lwyo-supabase-restore.sql`]);
      run("docker", ["exec", drillContainer, "psql", "-U", localAdmin, "-d", "postgres", "--single-transaction", "--set", "ON_ERROR_STOP=1", "--file", "/tmp/lwyo-supabase-restore.sql"]);
      const restoredCounts = JSON.parse(run("docker", ["exec", drillContainer, "psql", "-U", localAdmin, "-d", "postgres", "--tuples-only", "--no-align", "--set", "ON_ERROR_STOP=1", "--command", countQuery], { capture: true }));
      assertSupabaseCounts(expectedCounts, restoredCounts);
      console.log(`Verified Supabase restore counts: ${JSON.stringify(restoredCounts)}`);
    } else {
      if (drillUrl.includes("fxmdunpolhqponfchwsz")) throw new Error("Refusing to restore a backup into the production Supabase project.");
      const psql = await psqlBinary();
      run(psql, [drillUrl, "--single-transaction", "--set", "ON_ERROR_STOP=1", "--file", supabaseDump]);
      const restoredCounts = JSON.parse(run(psql, [drillUrl, "--tuples-only", "--no-align", "--set", "ON_ERROR_STOP=1", "--command", countQuery], { capture: true }));
      assertSupabaseCounts(expectedCounts, restoredCounts);
      console.log(`Verified Supabase restore counts: ${JSON.stringify(restoredCounts)}`);
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}
console.log("Restore drill completed without modifying production.");
