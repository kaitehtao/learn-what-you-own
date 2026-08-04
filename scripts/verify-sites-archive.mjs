import { execFileSync } from "node:child_process";
import path from "node:path";

const archive = process.argv[2];
if (!archive) throw new Error("Usage: npm run sites:verify-archive -- <archive.tgz>");

const entries = execFileSync("tar", ["-tzf", archive], { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);
const entrySet = new Set(entries);
for (const required of ["dist/server/index.js", "dist/.openai/hosting.json"]) {
  if (!entrySet.has(required)) throw new Error(`Sites archive is missing ${required}.`);
}
if (entries.some((entry) => entry.startsWith("dist/dist/"))) {
  throw new Error("Sites archive contains an invalid nested dist/dist tree.");
}

const trackedMigrations = new Set(
  execFileSync("git", ["ls-files", "--", "drizzle"], { encoding: "utf8" })
    .split("\n")
    .filter((file) => file.endsWith(".sql"))
    .map((file) => path.basename(file)),
);
const unexpectedMigration = entries
  .filter((entry) => entry.startsWith("dist/.openai/drizzle/") && entry.endsWith(".sql"))
  .map((entry) => path.basename(entry))
  .find((name) => !trackedMigrations.has(name));
if (unexpectedMigration) throw new Error(`Sites archive contains untracked migration ${unexpectedMigration}.`);

console.log(`Verified Sites archive with ${entries.length} entries and only commit-tracked migrations.`);
