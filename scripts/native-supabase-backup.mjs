import { access, mkdir, writeFile } from "node:fs/promises";
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

async function psqlBinary() {
  for (const candidate of [process.env.PSQL_PATH, "/opt/homebrew/opt/libpq/bin/psql", "psql"].filter(Boolean)) {
    if (candidate.includes("/")) {
      try { await access(candidate); } catch { continue; }
    }
    const check = spawnSync(candidate, ["--version"], { encoding: "utf8" });
    if (check.status === 0) return candidate;
  }
  throw new Error("psql is required. On macOS install Homebrew libpq; in CI set USE_DOCKER_POSTGRES_CLIENT=1.");
}

function dockerPostgresClient(command, args, connection, { capture = false } = {}) {
  return run("docker", [
    "run", "--rm",
    "-e", "PGHOST", "-e", "PGPORT", "-e", "PGUSER", "-e", "PGPASSWORD", "-e", "PGDATABASE", "-e", "PGSSLMODE", "-e", "PGOPTIONS",
    "postgres:17",
    command,
    ...args,
  ], { env: { ...process.env, ...connection, PGSSLMODE: "require", PGOPTIONS: "-c role=postgres" }, capture });
}

const connection = temporaryConnection();
await mkdir(path.dirname(output), { recursive: true });
const dumpArgs = [
  "--format=plain",
  "--no-owner",
  "--no-privileges",
  "--quote-all-identifiers",
  "--role=postgres",
  "--schema=public",
  "--schema=auth",
  "--schema=storage",
];
if (process.env.USE_DOCKER_POSTGRES_CLIENT === "1") {
  const containerOutput = `/backup/${path.basename(output)}`;
  run("docker", [
    "run", "--rm",
    "-e", "PGHOST", "-e", "PGPORT", "-e", "PGUSER", "-e", "PGPASSWORD", "-e", "PGDATABASE", "-e", "PGSSLMODE",
    "-v", `${path.dirname(output)}:/backup`,
    "postgres:17",
    "pg_dump",
    ...dumpArgs,
    `--file=${containerOutput}`,
  ], { env: { ...process.env, ...connection, PGSSLMODE: "require" } });
} else {
  const pgDump = await pgDumpBinary();
  run(pgDump, [...dumpArgs, `--file=${output}`], { env: { ...process.env, ...connection, PGSSLMODE: "require" } });
}

const countsQuery = `set role postgres;
select json_build_object(
  'auth.users', (select count(*) from auth.users),
  'public.profiles', (select count(*) from public.profiles),
  'storage.buckets', (select count(*) from storage.buckets),
  'storage.objects', (select count(*) from storage.objects)
)::text;`;
const psqlArgs = ["--tuples-only", "--no-align", "--set", "ON_ERROR_STOP=1", "--command", countsQuery];
const countsText = process.env.USE_DOCKER_POSTGRES_CLIENT === "1"
  ? dockerPostgresClient("psql", psqlArgs, connection, { capture: true })
  : run(await psqlBinary(), psqlArgs, { env: { ...process.env, ...connection, PGSSLMODE: "require", PGOPTIONS: "-c role=postgres" }, capture: true });
const countsLine = countsText.split("\n").findLast((line) => line.trim().startsWith("{"));
if (!countsLine) throw new Error("Supabase source counts were not returned as JSON.");
const counts = JSON.parse(countsLine);
await writeFile(path.join(path.dirname(output), "supabase-counts.json"), `${JSON.stringify(counts, null, 2)}\n`);
