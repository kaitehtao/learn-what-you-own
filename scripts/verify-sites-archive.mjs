import { execFileSync } from "node:child_process";

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

const hostingConfig = JSON.parse(execFileSync(
  "tar",
  ["-xOzf", archive, "dist/.openai/hosting.json"],
  { encoding: "utf8" },
));

const trackedMigrations = new Set(
  execFileSync("git", ["ls-files", "--", "drizzle"], { encoding: "utf8" })
    .split("\n")
    .filter((file) => file.endsWith(".sql"))
    .map((file) => `dist/.openai/${file}`),
);
const packagedMigrations = new Set(
  entries.filter((entry) => entry.startsWith("dist/.openai/drizzle/") && entry.endsWith(".sql")),
);
if (!hostingConfig.d1) {
  if (packagedMigrations.size) throw new Error("Redirect-only Sites archive must not contain D1 migrations.");
} else {
  const unexpectedMigration = [...packagedMigrations].find((entry) => !trackedMigrations.has(entry));
  if (unexpectedMigration) throw new Error(`Sites archive contains untracked migration ${unexpectedMigration}.`);
  const missingMigration = [...trackedMigrations].find((entry) => !packagedMigrations.has(entry));
  if (missingMigration) throw new Error(`Sites archive is missing tracked migration ${missingMigration}.`);
}

console.log(
  `Verified Sites archive with ${entries.length} entries and ${packagedMigrations.size} packaged migrations.`,
);
