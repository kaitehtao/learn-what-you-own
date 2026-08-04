import { env } from "cloudflare:workers";
import { ensureEarningsIntelligenceSchema } from "../db/runtimeSchema";
import { median, safeSurprisePercent, standardDeviation } from "./earnings-math";

export { parseFinancialNumber } from "./earnings-math";

export type EarningsProviderRecord = {
  ticker: string;
  reportDate: string;
  fiscalQuarter: string;
  epsEstimate: number | null;
  analystCount: number | null;
  epsActual: number | null;
  epsSurprisePercent: number | null;
};

type SnapshotRow = { ticker: string; eps_estimate: number | null; snapshot_date: string };
type CommunityRow = {
  ticker: string;
  eps_estimate: number | null;
  revenue_estimate_millions: number | null;
  thesis_case: "bull" | "base" | "bear";
  confidence: number;
};
type ResultRow = {
  ticker: string;
  eps_actual: number | null;
  eps_consensus_at_report: number | null;
  eps_surprise_percent: number | null;
};

export type CommunityEstimateAggregate = {
  participantCount: number;
  epsWhisper: number | null;
  revenueWhisperMillions: number | null;
  epsDispersion: number | null;
  medianConfidence: number | null;
  bullCount: number;
  baseCount: number;
  bearCount: number;
};

export type EarningsIntelligence = {
  community: CommunityEstimateAggregate;
  earliestStreetEps: number | null;
  latestStreetEps: number | null;
  epsRevisionAbsolute: number | null;
  epsRevisionPercent: number | null;
  snapshotCount: number;
  result: {
    epsActual: number | null;
    epsConsensusAtReport: number | null;
    epsSurprisePercent: number | null;
    whisperSurpriseAbsolute: number | null;
  } | null;
};

function emptyCommunity(): CommunityEstimateAggregate {
  return {
    participantCount: 0,
    epsWhisper: null,
    revenueWhisperMillions: null,
    epsDispersion: null,
    medianConfidence: null,
    bullCount: 0,
    baseCount: 0,
    bearCount: 0,
  };
}

function aggregateCommunity(rows: CommunityRow[]) {
  if (!rows.length) return emptyCommunity();
  const eps = rows.flatMap((row) => row.eps_estimate === null ? [] : [row.eps_estimate]);
  const revenue = rows.flatMap((row) => row.revenue_estimate_millions === null ? [] : [row.revenue_estimate_millions]);
  return {
    participantCount: rows.length,
    epsWhisper: median(eps),
    revenueWhisperMillions: median(revenue),
    epsDispersion: standardDeviation(eps),
    medianConfidence: median(rows.map((row) => row.confidence)),
    bullCount: rows.filter((row) => row.thesis_case === "bull").length,
    baseCount: rows.filter((row) => row.thesis_case === "base").length,
    bearCount: rows.filter((row) => row.thesis_case === "bear").length,
  } satisfies CommunityEstimateAggregate;
}

export async function recordProviderEarnings(records: EarningsProviderRecord[], sourceLabel: string, sourceUrl: string) {
  if (!records.length) return;
  await ensureEarningsIntelligenceSchema();
  const snapshotDate = new Date().toISOString().slice(0, 10);
  const statements = records.flatMap((record) => {
    const result = [];
    if (record.epsEstimate !== null && record.epsActual === null) {
      result.push(env.DB.prepare(`INSERT INTO earnings_consensus_snapshots
        (ticker,report_date,fiscal_quarter,snapshot_date,eps_estimate,analyst_count,source_label,source_url)
        VALUES (?,?,?,?,?,?,?,?)
        ON CONFLICT(ticker,report_date,snapshot_date,source_label) DO UPDATE SET
          fiscal_quarter=excluded.fiscal_quarter,
          eps_estimate=excluded.eps_estimate,
          analyst_count=excluded.analyst_count,
          source_url=excluded.source_url,
          captured_at=CURRENT_TIMESTAMP`)
        .bind(record.ticker, record.reportDate, record.fiscalQuarter, snapshotDate, record.epsEstimate, record.analystCount, sourceLabel, sourceUrl));
    }
    if (record.epsActual !== null) {
      const surprise = record.epsSurprisePercent ?? safeSurprisePercent(record.epsActual, record.epsEstimate);
      result.push(env.DB.prepare(`INSERT INTO earnings_results
        (ticker,report_date,fiscal_quarter,eps_actual,eps_consensus_at_report,eps_surprise_percent,source_label,source_url)
        VALUES (?,?,?,?,?,?,?,?)
        ON CONFLICT(ticker,report_date) DO UPDATE SET
          fiscal_quarter=excluded.fiscal_quarter,
          eps_actual=excluded.eps_actual,
          eps_consensus_at_report=excluded.eps_consensus_at_report,
          eps_surprise_percent=excluded.eps_surprise_percent,
          source_label=excluded.source_label,
          source_url=excluded.source_url,
          updated_at=CURRENT_TIMESTAMP`)
        .bind(record.ticker, record.reportDate, record.fiscalQuarter, record.epsActual, record.epsEstimate, surprise, sourceLabel, sourceUrl));
    }
    return result;
  });
  if (statements.length) await env.DB.batch(statements);
}

export async function loadEarningsIntelligence(reportDate: string, tickers: string[]) {
  const output = new Map<string, EarningsIntelligence>();
  if (!tickers.length) return output;
  await ensureEarningsIntelligenceSchema();
  const [snapshotResult, communityResult, resultResult] = await Promise.all([
    env.DB.prepare("SELECT ticker,eps_estimate,snapshot_date FROM earnings_consensus_snapshots WHERE report_date=? ORDER BY snapshot_date ASC,captured_at ASC").bind(reportDate).all<SnapshotRow>(),
    env.DB.prepare("SELECT ticker,eps_estimate,revenue_estimate_millions,thesis_case,confidence FROM earnings_community_estimates WHERE report_date=?").bind(reportDate).all<CommunityRow>(),
    env.DB.prepare("SELECT ticker,eps_actual,eps_consensus_at_report,eps_surprise_percent FROM earnings_results WHERE report_date=?").bind(reportDate).all<ResultRow>(),
  ]);
  const requested = new Set(tickers.map((ticker) => ticker.toUpperCase()));
  const snapshots = new Map<string, SnapshotRow[]>();
  const community = new Map<string, CommunityRow[]>();
  const results = new Map((resultResult.results ?? []).map((row) => [row.ticker, row]));
  for (const row of snapshotResult.results ?? []) {
    if (!requested.has(row.ticker)) continue;
    snapshots.set(row.ticker, [...(snapshots.get(row.ticker) ?? []), row]);
  }
  for (const row of communityResult.results ?? []) {
    if (!requested.has(row.ticker)) continue;
    community.set(row.ticker, [...(community.get(row.ticker) ?? []), row]);
  }
  for (const ticker of requested) {
    const history = snapshots.get(ticker) ?? [];
    const earliest = history[0]?.eps_estimate ?? null;
    const latest = history.at(-1)?.eps_estimate ?? null;
    const revisionAbsolute = earliest !== null && latest !== null ? latest - earliest : null;
    const revisionPercent = earliest !== null && latest !== null && Math.abs(earliest) >= 0.01
      ? (revisionAbsolute! / Math.abs(earliest)) * 100
      : null;
    const crowd = aggregateCommunity(community.get(ticker) ?? []);
    const recorded = results.get(ticker) ?? null;
    output.set(ticker, {
      community: crowd,
      earliestStreetEps: earliest,
      latestStreetEps: latest,
      epsRevisionAbsolute: revisionAbsolute,
      epsRevisionPercent: revisionPercent,
      snapshotCount: history.length,
      result: recorded ? {
        epsActual: recorded.eps_actual,
        epsConsensusAtReport: recorded.eps_consensus_at_report,
        epsSurprisePercent: recorded.eps_surprise_percent,
        whisperSurpriseAbsolute: recorded.eps_actual !== null && crowd.epsWhisper !== null
          ? recorded.eps_actual - crowd.epsWhisper
          : null,
      } : null,
    });
  }
  return output;
}
