import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { generateSecFactSql } from "./lib/sec-fact-sql";

const outputPath = resolve(process.argv[2] ?? "/tmp/sec-facts.sql");
const tickers = process.argv.slice(3).map((ticker) => ticker.trim().toUpperCase()).filter(Boolean);
if (!tickers.length) throw new Error("Pass one or more published dossier tickers.");

const statements = ["PRAGMA foreign_keys = ON;"];
const summary = [];
for (const ticker of tickers) {
  const result = await generateSecFactSql(ticker);
  statements.push(...result.statements);
  summary.push({ ticker, imported: result.imported, metrics: result.metrics, status: result.status });
  await new Promise((resolve) => setTimeout(resolve, 120));
}

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${statements.join("\n\n")}\n`);
console.log(JSON.stringify({ outputPath, tickers: summary.length, summary }, null, 2));
