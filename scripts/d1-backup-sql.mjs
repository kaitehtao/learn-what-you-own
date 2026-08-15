import { accessSync, createReadStream, createWriteStream } from "node:fs";
import { once } from "node:events";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { createInterface } from "node:readline";
import { run } from "./command.mjs";

export function normalizedD1RestoreSql(sql) {
  const companyTable = sql.match(/^CREATE TABLE companies .*?;$/m)?.[0];
  if (!companyTable) throw new Error("D1 export is missing the legacy companies table required by foreign keys.");

  const remainingSql = sql.replace(`${companyTable}\n`, "");
  return `BEGIN IMMEDIATE;\n${companyTable}\n${remainingSql.trimEnd()}\nCOMMIT;\n`;
}

async function companyTableFromFile(inputFile) {
  const lines = createInterface({ input: createReadStream(inputFile, { encoding: "utf8" }), crlfDelay: Infinity });
  for await (const line of lines) {
    if (/^CREATE TABLE companies .*;$/.test(line)) return line;
  }
  throw new Error("D1 export is missing the legacy companies table required by foreign keys.");
}

export async function normalizeD1RestoreFile(inputFile, outputFile) {
  const companyTable = await companyTableFromFile(inputFile);
  const output = createWriteStream(outputFile, { encoding: "utf8" });
  const write = async (value) => { if (!output.write(value)) await once(output, "drain"); };
  await write(`BEGIN IMMEDIATE;\n${companyTable}\n`);
  let skippedCompanyTable = false;
  const lines = createInterface({ input: createReadStream(inputFile, { encoding: "utf8" }), crlfDelay: Infinity });
  for await (const line of lines) {
    if (!skippedCompanyTable && line === companyTable) { skippedCompanyTable = true; continue; }
    await write(`${line}\n`);
  }
  await write("COMMIT;\n");
  output.end();
  await once(output, "close");
}

export function sqliteBinary() {
  for (const candidate of [process.env.SQLITE3_PATH, "/usr/bin/sqlite3", "sqlite3"].filter(Boolean)) {
    if (candidate.includes("/")) {
      try { accessSync(candidate); } catch { continue; }
    }
    const check = spawnSync(candidate, ["--version"], { encoding: "utf8" });
    if (check.status === 0) return candidate;
  }
  throw new Error("sqlite3 is required for the D1 restore drill.");
}

export function restoreD1WithSqlite(sqlFile, databaseFile) {
  const sqlite = sqliteBinary();
  run(sqlite, [databaseFile, ".bail on", `.read ${JSON.stringify(path.resolve(sqlFile))}`], { capture: true });
  return JSON.parse(run(sqlite, ["-json", databaseFile, "SELECT (SELECT COUNT(*) FROM companies) AS companies, (SELECT COUNT(*) FROM company_dossiers) AS dossiers, (SELECT COUNT(*) FROM filing_facts) AS filing_facts;"], { capture: true }));
}
