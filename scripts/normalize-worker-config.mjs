import { execFileSync } from "node:child_process";
import { readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const configPath = "dist/server/wrangler.json";
const config = JSON.parse(await readFile(configPath, "utf8"));

// Wrangler 4.114+ removed service environments and rejects the generated
// legacy_env field. vinext still emits it, so normalize only this retired
// setting while leaving routes, bindings, secrets, and scheduled jobs intact.
delete config.legacy_env;

await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);

// Sites packages the generated migration directory. Keep that artifact tied to
// the release commit so an unrelated local SQL draft can never be published.
const migrationDir = "dist/.openai/drizzle";
const trackedMigrations = new Set(
  execFileSync("git", ["ls-files", "--", "drizzle"], { encoding: "utf8" })
    .split("\n")
    .filter((file) => file.endsWith(".sql"))
    .map((file) => path.basename(file)),
);
let removedMigrations = 0;
for (const entry of await readdir(migrationDir, { withFileTypes: true })) {
  if (entry.isFile() && entry.name.endsWith(".sql") && !trackedMigrations.has(entry.name)) {
    await rm(path.join(migrationDir, entry.name));
    removedMigrations += 1;
  }
}

console.log(`Normalized generated Worker configuration for current Wrangler; removed ${removedMigrations} untracked migration artifact(s).`);
