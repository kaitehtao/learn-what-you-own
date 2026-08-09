import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { normalizedD1RestoreSql, restoreD1WithSqlite } from "../scripts/d1-backup-sql.mjs";

test("normalizes and restores a D1 export atomically", async () => {
  const raw = [
    "CREATE TABLE child (id INTEGER PRIMARY KEY, company_ticker TEXT REFERENCES companies(ticker));",
    "CREATE TABLE companies (ticker TEXT PRIMARY KEY NOT NULL);",
    "CREATE TABLE company_dossiers (ticker TEXT PRIMARY KEY NOT NULL);",
    "CREATE TABLE filing_facts (id INTEGER PRIMARY KEY NOT NULL);",
    "INSERT INTO companies VALUES ('AAPL');",
    "INSERT INTO company_dossiers VALUES ('AAPL');",
    "INSERT INTO filing_facts VALUES (1);",
    "",
  ].join("\n");
  const normalized = normalizedD1RestoreSql(raw);
  assert.match(normalized, /^BEGIN IMMEDIATE;\nCREATE TABLE companies/);
  assert.match(normalized, /COMMIT;\n$/);

  const directory = await mkdtemp(path.join(os.tmpdir(), "lwyo-d1-test-"));
  const sqlFile = path.join(directory, "restore.sql");
  await writeFile(sqlFile, normalized);
  const counts = restoreD1WithSqlite(sqlFile, path.join(directory, "restore.sqlite"));
  assert.deepEqual(counts, [{ companies: 1, dossiers: 1, filing_facts: 1 }]);
});
