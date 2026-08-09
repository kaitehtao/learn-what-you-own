import { accessSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { run } from "./command.mjs";

export function normalizedD1RestoreSql(sql) {
  const companyTable = sql.match(/^CREATE TABLE companies .*?;$/m)?.[0];
  if (!companyTable) throw new Error("D1 export is missing the legacy companies table required by foreign keys.");

  const remainingSql = sql.replace(`${companyTable}\n`, "");
  return `BEGIN IMMEDIATE;\n${companyTable}\n${remainingSql.trimEnd()}\nCOMMIT;\n`;
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
