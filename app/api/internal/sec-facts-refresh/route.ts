import { asc } from "drizzle-orm";
import { getDb } from "../../../../db";
import { filingFactImports } from "../../../../db/schema";
import { featuredDossiers } from "../../../data/featuredDossiers";
import { ensureFeaturedDossierRegistration, importSecFilingFacts } from "../../../data/secFactsRepository";

export const dynamic = "force-dynamic";

// The Worker invokes this small batch several times per day. Eight dossiers per
// run covers the current flagship universe within roughly one day without
// creating a burst against SEC data services or D1.
const SCHEDULED_REFRESH_LIMIT = 8;

export async function POST(request: Request) {
  const secret = process.env.SCHEDULED_TASK_SECRET || process.env.NOTIFICATION_CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const db = getDb();
  const importHistory = await db.select({
    ticker: filingFactImports.ticker,
    lastAttemptedAt: filingFactImports.lastAttemptedAt,
  }).from(filingFactImports).orderBy(asc(filingFactImports.lastAttemptedAt));
  const attempts = new Map(importHistory.map((row) => [row.ticker, row.lastAttemptedAt]));
  const candidates = [...new Set(Object.values(featuredDossiers).map((dossier) => dossier.ticker))]
    .map((ticker) => ({ ticker, lastAttemptedAt: attempts.get(ticker) ?? null }))
    .sort((left, right) => String(left.lastAttemptedAt ?? "").localeCompare(String(right.lastAttemptedAt ?? "")) || left.ticker.localeCompare(right.ticker))
    .slice(0, SCHEDULED_REFRESH_LIMIT);

  const results: Array<{ ticker: string; imported?: number; metrics?: number; quarterlyUpdate?: unknown; status: string; error?: string }> = [];
  for (const candidate of candidates) {
    try {
      await ensureFeaturedDossierRegistration(candidate.ticker);
      const imported = await importSecFilingFacts(candidate.ticker);
      results.push({ ticker: candidate.ticker, imported: imported.imported, metrics: imported.metrics, quarterlyUpdate: imported.quarterlyUpdate, status: imported.status });
    } catch (error) {
      results.push({ ticker: candidate.ticker, status: "error", error: error instanceof Error ? error.message : "SEC import failed." });
    }
  }

  return Response.json({ processed: results.length, results });
}
