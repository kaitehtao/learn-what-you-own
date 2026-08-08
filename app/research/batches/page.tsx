import type { Metadata } from "next";
import Link from "next/link";
import { env } from "cloudflare:workers";
import { Header } from "../../ui";
import { sp500DossierBatch01, sp500DossierBatch02, sp500DossierBatch03, sp500DossierBatch04, sp500DossierBatch05, sp500DossierBatch06, sp500DossierBatchAsOf, sp500DossierBatchSource, type DossierBatchCompany } from "../../data/sp500DossierBatches";
import { formatMarketCap } from "../../market-snapshot";
import { CompanyLogo } from "../../CompanyLogo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Company Dossier Research Batches | Learn What You Own",
  description: "Track evidence ingestion and benchmark-complete company dossier batches across the Learn What You Own research universe.",
  alternates: { canonical: "https://learnwhatyouown.com/research/batches" },
};

type RolloutCompany = { priority_rank:number;ticker:string;name:string;market_cap:number|null;workflow_status:string;quality_tier:string;source_count:number };
type RolloutSummary = { total:number;benchmark_complete:number;evidence_ready:number;evidence_ingestion:number;research_backlog:number };
type QualityRule = { id:string;label:string;min_source_count:number;min_verified_claim_count:number;min_distinct_section_count:number;min_distinct_claim_type_count:number };
type SourceBackfillBatch = { id:string;selected_count:number;success_count:number;skipped_count:number;error_count:number;source_count_added:number;status:string;started_at:string;completed_at:string|null;is_superseded_diagnostic:number };
type SourceBackfillItem = { batch_id:string;ticker:string;status:string;source_count_after:number;facts_import_status:string };

function money(value: number) {
  if (value >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
  return `$${Math.round(value / 1_000_000_000)}B`;
}

function dossierPath(ticker: string) {
  const primary = ticker.split("/")[0];
  return `/company/${primary.toLowerCase().replace(".", "-")}`;
}

function BatchList({ companies }: { companies: DossierBatchCompany[] }) {
  return <div className="research-batch-list">
    <div className="research-batch-head"><span>Rank</span><span>Company</span><span>Market cap</span><span>Status</span></div>
    {companies.map(company => <Link href={dossierPath(company.ticker)} key={company.rank}>
      <span>{String(company.rank).padStart(2, "0")}</span>
      <span><CompanyLogo ticker={company.ticker} companyName={company.name} /><strong>{company.name}</strong></span>
      <span>{money(company.marketCap)}</span>
      <span className="batch-complete">Complete</span>
    </Link>)}
  </div>;
}

function ResearchFoundationList({ companies }: { companies: RolloutCompany[] }) {
  return <div className="research-batch-list">
    <div className="research-batch-head"><span>Rank</span><span>Company</span><span>Market cap</span><span>Status</span></div>
    {companies.map(company => <Link href={dossierPath(company.ticker)} key={company.ticker}>
      <span>{String(company.priority_rank).padStart(2, "0")}</span>
      <span><CompanyLogo ticker={company.ticker} companyName={company.name} /><strong>{company.name}</strong></span>
      <span>{formatMarketCap(company.market_cap)}</span>
      <span className="batch-foundation">Research foundation · {company.source_count} sources</span>
    </Link>)}
  </div>;
}

export default async function ResearchBatchesPage() {
  let russellRollout: RolloutCompany[] = [];
  let russellSummary: RolloutSummary | null = null;
  let qualityRule: QualityRule | null = null;
  let sourceBackfillBatches: SourceBackfillBatch[] = [];
  let sourceBackfillItems: SourceBackfillItem[] = [];
  try {
    const [result, summary, rule] = await Promise.all([
      env.DB.prepare(`SELECT m.priority_rank,m.ticker,c.name,c.market_cap,m.workflow_status,
      COALESCE(d.quality_tier,'starting_point') AS quality_tier,m.source_count
      FROM dossier_expansion_members m JOIN companies c ON c.ticker=m.ticker
      LEFT JOIN company_dossiers d ON d.ticker=m.ticker
      WHERE m.batch_id=(SELECT id FROM dossier_expansion_batches WHERE universe_name='Russell 2000' AND status IN ('active','in_progress') ORDER BY updated_at DESC LIMIT 1)
      ORDER BY m.priority_rank LIMIT 100`).all<RolloutCompany>(),
      env.DB.prepare(`SELECT COUNT(*) AS total,
        SUM(CASE WHEN workflow_status='benchmark_complete' THEN 1 ELSE 0 END) AS benchmark_complete,
        SUM(CASE WHEN workflow_status='evidence_ready' THEN 1 ELSE 0 END) AS evidence_ready,
        SUM(CASE WHEN workflow_status='evidence_ingestion' THEN 1 ELSE 0 END) AS evidence_ingestion,
        SUM(CASE WHEN workflow_status='research_backlog' THEN 1 ELSE 0 END) AS research_backlog
        FROM dossier_expansion_members
        WHERE batch_id=(SELECT id FROM dossier_expansion_batches WHERE universe_name='Russell 2000' AND status IN ('active','in_progress') ORDER BY updated_at DESC LIMIT 1)`).first<RolloutSummary>(),
      env.DB.prepare(`SELECT id,label,min_source_count,min_verified_claim_count,
        min_distinct_section_count,min_distinct_claim_type_count
        FROM dossier_quality_rules WHERE is_active=1 ORDER BY updated_at DESC LIMIT 1`).first<QualityRule>(),
    ]);
    russellRollout = result.results;
    russellSummary = summary;
    qualityRule = rule;
  } catch (error) {
    console.error("Unable to load active Russell dossier rollout", error);
  }
  try {
    const [batches, items] = await Promise.all([
      env.DB.prepare(`SELECT b.id,b.selected_count,b.success_count,b.skipped_count,b.error_count,
        b.source_count_added,b.status,b.started_at,b.completed_at,
        CASE WHEN b.status='failed' AND b.success_count=0 AND b.source_count_added=0
          AND EXISTS (
            SELECT 1 FROM dossier_source_backfill_batches newer
            WHERE newer.universe_name=b.universe_name AND newer.started_at>b.started_at
              AND newer.status='completed' AND newer.success_count>0
          ) THEN 1 ELSE 0 END AS is_superseded_diagnostic
        FROM dossier_source_backfill_batches b
        WHERE b.status<>'running' ORDER BY b.started_at DESC LIMIT 20`).all<SourceBackfillBatch>(),
      env.DB.prepare(`SELECT batch_id,ticker,status,source_count_after,facts_import_status
        FROM dossier_source_backfill_items
        WHERE batch_id IN (
          SELECT id FROM dossier_source_backfill_batches WHERE status<>'running' ORDER BY started_at DESC LIMIT 20
        ) ORDER BY batch_id DESC,priority_rank`).all<SourceBackfillItem>(),
    ]);
    sourceBackfillBatches = batches.results;
    sourceBackfillItems = items.results;
  } catch (error) {
    console.error("Unable to load SEC source backfill ledger", error);
  }
  return <main className="research-batches-page">
    <Header />
    <section className="research-batch-hero">
      <div className="container">
        <span className="kicker">S&amp;P 500 DOSSIER PROGRAM</span>
        <h1>Full S&amp;P 500 coverage.<br/>One owner standard.</h1>
        <p>We are building complete, evidence-linked owner dossiers in descending market-cap order, excluding companies already completed as flagship or legacy dossiers. Alphabet’s two share classes share one company dossier.</p>
        <div className="research-batch-proof"><strong>Batches 01–06 · 503 component ticker rows covered</strong><span>497 ranked company records plus earlier flagship dossiers and consolidated share classes · Market-cap snapshot: {sp500DossierBatchAsOf}</span><a href={sp500DossierBatchSource} target="_blank" rel="noreferrer">Nasdaq source ↗</a></div>
      </div>
    </section>
    {russellRollout.length > 0 && <section className="container research-batch-section">
      <header><div><span className="kicker">RUSSELL 2000 · FULL-UNIVERSE DOSSIER PROGRAM</span><h2>{Number(russellSummary?.total??russellRollout.length).toLocaleString()} members ranked by current market capitalization</h2></div><p>Automated SEC evidence ingestion advances the full universe in controlled batches. {Number(russellSummary?.benchmark_complete??0).toLocaleString()} currently pass the benchmark; the table shows the next 100 highest-priority records. Research foundations are not labeled complete until claim-level evidence and balanced bull/bear analysis pass editorial review.</p></header>
      <ResearchFoundationList companies={russellRollout} />
      <aside className="research-batch-method"><strong>Live ranking and completion policy</strong><p>Market capitalizations refresh from Nasdaq’s listed-universe feed. D1 recalculates descending rank after each refresh; missing values appear last and are never replaced by fabricated estimates. {qualityRule ? `Completion is database-calculated under “${qualityRule.label}”: ${qualityRule.min_source_count}+ sources, ${qualityRule.min_verified_claim_count}+ verified claims, ${qualityRule.min_distinct_section_count}+ sections, and ${qualityRule.min_distinct_claim_type_count}+ evidence classes.` : "The active completion rule is read from D1 rather than a ticker list."}</p></aside>
    </section>}
    {sourceBackfillBatches.length > 0 && <section className="container research-batch-section source-backfill-ledger">
      <header><div><span className="kicker">LIVE SEC SOURCE BACKFILL</span><h2>Completed batch ticker ledger</h2></div><p>The Russell 3000 pass includes the Russell 2000 subset once, preventing duplicate SEC requests. These batches establish exact filing sources and normalized facts; “benchmark complete” still requires verified claims and editorial review.</p></header>
      <div className="source-backfill-batches">{sourceBackfillBatches.map(batch => {
        const items = sourceBackfillItems.filter(item => item.batch_id === batch.id);
        const superseded = Boolean(batch.is_superseded_diagnostic);
        return <details key={batch.id} open={batch === sourceBackfillBatches[0]} className={superseded ? "superseded-diagnostic" : undefined}>
          <summary><span><strong>{batch.id}</strong><small>{superseded ? "Superseded diagnostic run · inactive" : batch.completed_at ? new Date(batch.completed_at).toLocaleString("en-US", { dateStyle:"medium", timeStyle:"short", timeZone:"America/Los_Angeles" }) : "Completed"}</small></span><span>{superseded ? "Superseded by a later successful batch" : <>{batch.success_count} sourced · {batch.source_count_added} filings added{batch.error_count ? ` · ${batch.error_count} errors` : ""}{batch.skipped_count ? ` · ${batch.skipped_count} skipped` : ""}</>}</span></summary>
          <div className="source-backfill-tickers">{items.map(item => <Link href={dossierPath(item.ticker)} key={`${batch.id}-${item.ticker}`} className={item.status} title={`${item.status.replaceAll("_"," ")} · ${item.source_count_after} sources · facts ${item.facts_import_status.replaceAll("_"," ")}`}><strong>{item.ticker}</strong><small>{item.source_count_after} sources</small></Link>)}</div>
        </details>;
      })}</div>
    </section>}
    <section className="container research-batch-section">
      <header><div><span className="kicker">BATCH 01</span><h2>Largest S&amp;P 500 companies</h2></div><p>Each dossier includes the business model, balanced thesis, six financial drivers, five material risks, four watchpoints, six owner questions, six comparables, and primary SEC and company sources.</p></header>
      <BatchList companies={sp500DossierBatch01} />
    </section>
    <section className="container research-batch-section">
      <header><div><span className="kicker">BATCH 02</span><h2>Ranks 31–100 by market cap</h2></div><p>Seventy additional companies researched with the same financial-driver, risk, monitoring, comparables, SEC, and official-company source requirements.</p></header>
      <BatchList companies={sp500DossierBatch02} />
    </section>
    <section className="container research-batch-section">
      <header><div><span className="kicker">BATCH 03</span><h2>Ranks 101–200 by market cap</h2></div><p>One hundred additional dossiers use the same evidence ledger: 10-K, 10-Q, earnings-related 8-K, proxy, official management commentary, balanced bull and bear hypotheses, comparables, and quarterly monitoring.</p></header>
      <BatchList companies={sp500DossierBatch03} />
    </section>
    <section className="container research-batch-section">
      <header><div><span className="kicker">BATCH 04</span><h2>Ranks 201–300 by market cap</h2></div><p>One hundred additional complete owner dossiers, continuing below the prior batch after excluding S&amp;P 500 companies whose flagship or legacy dossiers were already complete.</p></header>
      <BatchList companies={sp500DossierBatch04} />
    </section>
    <section className="container research-batch-section">
      <header><div><span className="kicker">BATCH 05</span><h2>Ranks 301–400 by market cap</h2></div><p>One hundred additional complete owner dossiers, continuing the same business-model, balanced-thesis, SEC evidence, ownership, comparable-company, official-newsroom, and quarterly-monitoring standard.</p></header>
      <BatchList companies={sp500DossierBatch05} />
    </section>
    <section className="container research-batch-section">
      <header><div><span className="kicker">FINAL BATCH 06</span><h2>Ranks 401–497 by market cap</h2></div><p>The final 97 previously unfinished constituents complete the full S&amp;P 500 component universe. The count reflects multiple listed share classes, Alphabet’s consolidated dossier, and five S&amp;P companies whose flagship dossiers were already complete before this ranked program.</p></header>
      <BatchList companies={sp500DossierBatch06} />
      <aside className="research-batch-method"><strong>How ranking and evidence work</strong><p>Companies are ordered by the Nasdaq Stock Screener market-cap snapshot. Multiple listed share classes of the same operating company are consolidated into one research dossier; GOOG and GOOGL therefore share Alphabet research. An issuer-published transcript is preferred; otherwise the dossier points owners to the official webcast, prepared remarks, earnings release, filed exhibits, and SEC reports, with third-party transcripts labeled secondary.</p></aside>
    </section>
  </main>;
}
