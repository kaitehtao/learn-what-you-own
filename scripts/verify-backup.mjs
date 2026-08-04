import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const backupDir = path.resolve(process.argv[2] ?? "");
if (!process.argv[2]) throw new Error("Usage: npm run backup:verify -- <backup-directory>");
const manifest = JSON.parse(await readFile(path.join(backupDir, "manifest.json"), "utf8"));
if (manifest.format !== 1 || !Array.isArray(manifest.files)) throw new Error("Unsupported backup manifest.");
for (const expected of manifest.files) {
  const file = path.join(backupDir, expected.path);
  const info = await stat(file);
  const hash = createHash("sha256").update(await readFile(file)).digest("hex");
  if (info.size !== expected.bytes || hash !== expected.sha256) throw new Error(`Backup integrity failure: ${expected.path}`);
}
const d1Sql = await readFile(path.join(backupDir, "d1-restore.sql"), "utf8");
for (const required of ["CREATE TABLE companies", "CREATE TABLE `company_dossiers`", "CREATE TABLE `filing_facts`"]) {
  if (!d1Sql.includes(required)) throw new Error(`D1 restore file is missing ${required}.`);
}
console.log(`Verified ${manifest.files.length} backup files from ${manifest.createdAt}.`);
