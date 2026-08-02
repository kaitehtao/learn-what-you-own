import { asc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { companyDossiers, filingFactImports } from "../../../../db/schema";
import { importSecFilingFacts } from "../../../data/secFactsRepository";

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
  const candidates = await db.select({
    ticker: companyDossiers.ticker,
    lastAttemptedAt: filingFactImports.lastAttemptedAt,
  }).from(companyDossiers)
    .leftJoin(filingFactImports, eq(filingFactImports.ticker, companyDossiers.ticker))
    .where(eq(companyDossiers.status, "published"))
    .orderBy(asc(filingFactImports.lastAttemptedAt), asc(companyDossiers.ticker))
    .limit(SCHEDULED_REFRESH_LIMIT);

  const results: Array<{ ticker: string; imported?: number; metrics?: number; quarterlyUpdate?: unknown; status: string; error?: string }> = [];
  for (const candidate of candidates) {
    try {
      const imported = await importSecFilingFacts(candidate.ticker);
      results.push({ ticker: candidate.ticker, imported: imported.imported, metrics: imported.metrics, quarterlyUpdate: imported.quarterlyUpdate, status: imported.status });
    } catch (error) {
      results.push({ ticker: candidate.ticker, status: "error", error: error instanceof Error ? error.message : "SEC import failed." });
    }
  }

  return Response.json({ processed: results.length, results });
}
