import { access } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { run } from "./command.mjs";

const output = path.resolve(process.argv[2] ?? "");
if (!process.argv[2]) throw new Error("A Supabase dump destination is required.");

function temporaryConnection() {
  const result = spawnSync("npx", ["supabase", "db", "dump", "--linked", "--dry-run"], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error("Supabase could not create temporary database credentials for the linked project.");
  const script = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  const values = {};
  for (const key of ["PGHOST", "PGPORT", "PGUSER", "PGPASSWORD", "PGDATABASE"]) {
    const value = script.match(new RegExp(`export ${key}="([^"]+)"`))?.[1];
    if (!value) throw new Error(`Supabase temporary connection is missing ${key}.`);
    values[key] = value;
  }
  if (!values.PGUSER.endsWith(".fxmdunpolhqponfchwsz")) throw new Error("Supabase temporary login does not belong to the production project.");
  return values;
}

async function pgDumpBinary() {
  for (const candidate of [process.env.PG_DUMP_PATH, "/opt/homebrew/opt/libpq/bin/pg_dump", "pg_dump"].filter(Boolean)) {
    if (candidate.includes("/")) {
      try { await access(candidate); } catch { continue; }
    }
    const check = spawnSync(candidate, ["--version"], { encoding: "utf8" });
    if (check.status === 0) return candidate;
  }
  throw new Error("pg_dump is required. On macOS install Homebrew libpq; GitHub runners include PostgreSQL tools.");
}

const connection = temporaryConnection();
const pgDump = await pgDumpBinary();
run(pgDump, [
  "--format=plain",
  "--no-owner",
  "--no-privileges",
  "--quote-all-identifiers",
  "--role=postgres",
  "--schema=public",
  "--schema=auth",
  "--schema=storage",
  `--file=${output}`,
], { env: { ...process.env, ...connection, PGSSLMODE: "require" } });
