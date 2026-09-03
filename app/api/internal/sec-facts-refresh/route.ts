import { env } from "cloudflare:workers";
import { ensureFeaturedDossierRegistration, importSecFilingFacts } from "../../../data/secFactsRepository";

export const dynamic = "force-dynamic";

// The Worker invokes this serial batch several times per day. It rotates across
// all evidence-bearing published dossiers without creating a burst against SEC
// data services or D1; first dossier reads can still self-heal sooner.
const SCHEDULED_REFRESH_LIMIT = 4;

function secretValue() {
  const bindings = env as unknown as Record<string, unknown>;
  // The production scheduler and the other scheduled routes use
  // NOTIFICATION_CRON_SECRET. Keep the legacy name only as a local fallback;
  // preferring it in production rejects the Worker's valid bearer token when
  // both secrets exist with different historical values.
  const value = bindings.NOTIFICATION_CRON_SECRET || bindings.SCHEDULED_TASK_SECRET;
  return typeof value === "string" && value ? value : process.env.NOTIFICATION_CRON_SECRET || process.env.SCHEDULED_TASK_SECRET;
}

export async function POST(request: Request) {
  const secret = secretValue();
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const candidateResult = await env.DB.prepare(`SELECT d.ticker,f.last_attempted_at AS lastAttemptedAt
    FROM company_dossiers d JOIN companies c ON c.ticker=d.ticker
    LEFT JOIN filing_fact_imports f ON f.ticker=d.ticker
    WHERE d.status='published' AND COALESCE(d.quality_tier,'starting_point')<>'starting_point'
      AND c.cik IS NOT NULL AND c.cik<>'' AND c.is_active=1
    ORDER BY COALESCE(f.last_attempted_at,'') ASC,d.ticker ASC LIMIT ?`)
    .bind(SCHEDULED_REFRESH_LIMIT).all<{ticker:string;lastAttemptedAt:string|null}>();
  const candidates = candidateResult.results;

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
