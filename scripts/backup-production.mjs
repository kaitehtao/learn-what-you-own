import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { run } from "./command.mjs";
import { normalizeD1RestoreFile } from "./d1-backup-sql.mjs";

const CLOUDFLARE_ACCOUNT_ID = "e5c3672efaf52cf5b417da2b09e687af";
const D1_DATABASE_ID = "8c2f7a1b-aa6e-45be-8e89-8c64bb0be557";
const D1_DATABASE_NAME = "site-creator-d1";
const SUPABASE_PROJECT_REF = "fxmdunpolhqponfchwsz";

const stamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
const outputIndex = process.argv.indexOf("--output");
const outputDir = path.resolve(outputIndex >= 0 ? process.argv[outputIndex + 1] : `backups/${stamp}`);
const d1Only = process.argv.includes("--d1-only");
const skipStorage = process.argv.includes("--skip-storage");

function requireValue(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for a complete production backup.`);
  return value;
}

async function sha256(file) {
  return createHash("sha256").update(await readFile(file)).digest("hex");
}

async function manifestFiles(root, current = root) {
  const files = [];
  for (const entry of await readdir(current, { withFileTypes: true })) {
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) files.push(...await manifestFiles(root, absolute));
    else if (entry.isFile() && entry.name !== "manifest.json") {
      const info = await stat(absolute);
      files.push({ path: path.relative(root, absolute), bytes: info.size, sha256: await sha256(absolute) });
    }
  }
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

async function listStorageObjects(client, bucket, prefix = "") {
  const results = [];
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await client.storage.from(bucket).list(prefix, { limit: 100, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw error;
    for (const item of data ?? []) {
      const objectPath = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id) results.push(objectPath);
      else results.push(...await listStorageObjects(client, bucket, objectPath));
    }
    if ((data ?? []).length < 100) break;
  }
  return results;
}

async function backupStorage() {
  const url = requireValue("SUPABASE_URL");
  if (!url.includes(SUPABASE_PROJECT_REF)) throw new Error("SUPABASE_URL does not identify the production project.");
  const client = createClient(url, requireValue("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: buckets, error } = await client.storage.listBuckets();
  if (error) throw error;
  for (const bucket of buckets ?? []) {
    for (const objectPath of await listStorageObjects(client, bucket.id)) {
      const { data, error: downloadError } = await client.storage.from(bucket.id).download(objectPath);
      if (downloadError) throw downloadError;
      const destination = path.join(outputDir, "supabase-storage", bucket.id, ...objectPath.split("/"));
      await mkdir(path.dirname(destination), { recursive: true });
      await writeFile(destination, Buffer.from(await data.arrayBuffer()));
    }
  }
}

await mkdir(outputDir, { recursive: true });
const whoami = run("npx", ["wrangler", "whoami"], { capture: true });
if (!whoami.includes(CLOUDFLARE_ACCOUNT_ID)) {
  throw new Error("Cloudflare login does not match the authoritative production account.");
}
const d1Info = JSON.parse(run("npx", ["wrangler", "d1", "info", D1_DATABASE_NAME, "--json"], { capture: true }));
if (d1Info.uuid !== D1_DATABASE_ID) throw new Error("D1 identity does not match the authoritative database.");

const rawD1 = path.join(outputDir, "d1.sql");
run("npx", ["wrangler", "d1", "export", D1_DATABASE_NAME, "--remote", "--output", rawD1, "--skip-confirmation"]);
await normalizeD1RestoreFile(rawD1, path.join(outputDir, "d1-restore.sql"));

if (!d1Only) {
  run("node", ["scripts/native-supabase-backup.mjs", path.join(outputDir, "supabase.sql")]);
  if (!skipStorage) await backupStorage();
}

const manifest = {
  format: 1,
  createdAt: new Date().toISOString(),
  gitCommit: run("git", ["rev-parse", "HEAD"], { capture: true }),
  cloudflareAccountId: CLOUDFLARE_ACCOUNT_ID,
  d1: { name: D1_DATABASE_NAME, id: D1_DATABASE_ID },
  supabase: d1Only ? null : { projectRef: SUPABASE_PROJECT_REF, storageIncluded: !skipStorage },
  files: await manifestFiles(outputDir),
};
await writeFile(path.join(outputDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Production backup created at ${outputDir}`);
