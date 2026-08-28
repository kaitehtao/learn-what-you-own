import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function source(path) {
  const contents = await readFile(new URL(path, root), "utf8");
  if (path !== "app/page.tsx") return contents;
  return `${contents}\n${await readFile(new URL("app/HomePageClient.tsx", root), "utf8")}`;
}

test("describes homepage search honestly and offers supported examples", async () => {
  const [home, search] = await Promise.all([
    source("app/page.tsx"),
    source("app/data/companySearch.ts"),
  ]);

  assert.match(home, /placeholder="Search ticker, company, sector, or index"/);
  assert.match(home, /Search by ticker, company, sector, or index/);
  assert.match(home, /\["AMC", "NVIDIA", "Semiconductors", "S&P 500"\]/);
  assert.doesNotMatch(home, />Popular </);
  assert.doesNotMatch(home, /executive, or theme/);
  assert.match(search, /company\.ticker/);
  assert.match(search, /company\.name/);
  assert.match(search, /company\.sector/);
  assert.match(search, /company\.memberships/);
});

test("leads the homepage with a strong free-account call to action and concrete benefits", async () => {
  const [home, styles] = await Promise.all([
    source("app/page.tsx"),
    source("app/globals.css"),
  ]);

  assert.match(home, /Create my free account/);
  assert.match(home, /href="\/login\?mode=signup"/);
  assert.match(home, /Existing member sign in/);
  assert.match(home, /className="hero-secondary-cta" href="\/login"/);
  assert.match(home, /Browse public dossiers/);
  assert.match(home, /Watchlists \+ portfolio/);
  assert.match(home, /Earnings alerts/);
  assert.match(home, /Research notebook/);
  assert.match(home, /Community rewards/);
  assert.match(home, /Your portfolio stays private/);
  assert.match(home, /contribute research, earn rewards, monitor a watchlist, receive earnings alerts, send public and private messages, take notes, and track what you own/);
  assert.match(styles, /\.hero-account-actions/);
  assert.match(styles, /\.hero-benefit-grid/);
});

test("features the full benchmark dossier set, including the four new companies", async () => {
  const [home, companyPage, registry, additions, complements, validator] = await Promise.all([
    source("app/page.tsx"),
    source("app/company/[ticker]/page.tsx"),
    source("app/data/featuredDossiers.ts"),
    source("app/data/additionalFlagshipDossiers.ts"),
    source("app/data/dossierBenchmarkComplements.ts"),
    source("scripts/validate-featured-dossiers.ts"),
  ]);

  for (const ticker of ["AMD", "MSFT", "GOOG", "META"]) {
    assert.match(home, new RegExp(`ticker: "${ticker}"`));
    assert.match(additions, new RegExp(`${ticker}: \\{`));
  }

  assert.match(registry, /Object\.assign\(featuredDossiers, additionalFlagshipDossiers\)/);
  assert.match(registry, /completeDossierBenchmark/);
  assert.match(companyPage, /export const dynamic = "force-dynamic"/);
  assert.match(complements, /completeness: 100/);
  assert.match(validator, /financialDrivers\.length >= 6/);
  assert.match(validator, /dossier\.risks\.length >= 5/);
  assert.match(validator, /dossier\.sources\.length >= 5/);
});

test("publishes Cerebras as a public flagship dossier and AMD comparable", async () => {
  const [registry, dossier, universe, secCompanies, marketCaps, earnings, amd, complements] = await Promise.all([
    source("app/data/featuredDossiers.ts"),
    source("app/data/cerebrasDossier.ts"),
    source("app/data/universe.ts"),
    source("app/data/secCompanies.generated.ts"),
    source("app/data/marketCaps.generated.ts"),
    source("app/data/earningsVerifications.ts"),
    source("app/data/additionalFlagshipDossiers.ts"),
    source("app/data/dossierBenchmarkComplements.ts"),
  ]);

  assert.match(registry, /featuredDossiers\.CBRS = cerebrasDossier/);
  assert.match(dossier, /ticker: "CBRS"[\s\S]{0,120}completeness: 100/);
  assert.match(dossier, /Cerebras Q1 2026 Form 10-Q/);
  assert.match(dossier, /Cerebras IPO Prospectus/);
  assert.match(dossier, /Q2 earnings · August 12, 2026/);
  assert.match(universe, /ticker: "CBRS"[\s\S]*name: "CEREBRAS SYSTEMS INC\."/);
  assert.match(secCompanies, /"CBRS": \{"cik":"0002021728"/);
  assert.match(marketCaps, /"CBRS": 49020439223/);
  assert.match(earnings, /ticker: "CBRS"[\s\S]*date: "2026-08-12"/);
  for (const comparableSource of [amd, complements]) {
    assert.match(comparableSource, /name: "Cerebras Systems", ticker: "CBRS", ownership: "Public"/);
    assert.doesNotMatch(comparableSource, /name: "Cerebras Systems", ticker: "PRIVATE"/);
  }
});

test("shows current stock price and compact market capitalization on every detailed dossier and homepage card", async () => {
  const [featured, starter, ondas, home, snapshot, formatters, api, quotes] = await Promise.all([
    source("app/FeaturedCompanyDossier.tsx"),
    source("app/company/[ticker]/page.tsx"),
    source("app/company/onds/page.tsx"),
    source("app/page.tsx"),
    source("app/CompanyMarketSnapshot.tsx"),
    source("app/market-snapshot.ts"),
    source("app/api/market-snapshot/route.ts"),
    source("app/market-quotes.ts"),
  ]);
  assert.match(featured, /<CompanyMarketSnapshot ticker=\{company\.ticker\}/);
  assert.match(starter, /<CompanyMarketSnapshot ticker=\{company\.ticker\}/);
  assert.match(ondas, /<FeaturedCompanyDossier company=\{company\} dossier=\{dossier\}/);
  assert.match(snapshot, /CURRENT STOCK PRICE/);
  assert.match(snapshot, /MARKET CAPITALIZATION/);
  assert.match(home, /className="card-market-data"/);
  assert.match(home, /CURRENT PRICE/);
  assert.match(home, /MARKET CAP/);
  assert.match(api, /cache-control/);
  assert.match(quotes, /summary\?assetclass=stocks/);
  assert.match(quotes, /MarketCap/);
  assert.match(formatters, /maximumFractionDigits: scale\[1\] && Math\.abs\(scaled\) < 10 \? 1 : 0/);
});

test("standardizes comparable analysis across every completed dossier", async () => {
  const [dossier, panel, api, metrics, styles] = await Promise.all([
    source("app/FeaturedCompanyDossier.tsx"),
    source("app/ComparableAnalysisPanel.tsx"),
    source("app/api/comparables/route.ts"),
    source("app/data/comparableMetrics.ts"),
    source("app/globals.css"),
  ]);

  assert.match(dossier, /<ComparableAnalysisPanel ticker=\{company\.ticker\}/);
  assert.match(panel, /STANDARDIZED OWNER LENS/);
  for (const label of ["Market cap", "FY revenue", "EV \/ revenue", "P \/ earnings", "P \/ free cash flow", "Cash", "Reported LT debt", "Net cash \/ \(debt\)", "Gross margin"]) {
    assert.match(panel, new RegExp(label.replace(/[()]/g, "\\$&")));
  }
  assert.match(api, /ownership === "Public"/);
  assert.match(api, /Latest SEC-reported fiscal-year revenue/);
  assert.match(metrics, /return null/);
  assert.match(metrics, /Financial-company lens/);
  assert.match(metrics, /Real-estate lens/);
  assert.match(styles, /\.comparable-metric-row/);
  assert.match(styles, /@media\(max-width:480px\)/);
});

test("lets investors build, sort, share, and export custom ten-company comp tables", async () => {
  const [page, builder, api, metrics, secMetrics, navigation, layout, styles] = await Promise.all([
    source("app/comps/page.tsx"),
    source("app/comps/CompTableBuilder.tsx"),
    source("app/api/comp-table/route.ts"),
    source("app/data/comparableMetrics.ts"),
    source("app/data/secMetrics.ts"),
    source("app/ui.tsx"),
    source("app/layout.tsx"),
    source("app/globals.css"),
  ]);
  assert.match(page, /Add up to ten tickers/);
  assert.match(builder, /const MAX_TICKERS = 10/);
  assert.match(builder, /EV \/ EBITDA/);
  assert.match(builder, /Sort by/);
  assert.match(builder, /Copy share link/);
  assert.match(builder, /Export CSV/);
  assert.match(builder, /Valuation/);
  assert.match(builder, /Balance sheet/);
  assert.match(api, /no more than ten tickers/);
  assert.match(api, /SEC-reported operating income plus SEC-reported depreciation and amortization/);
  assert.match(api, /MAX_STORED_FACT_AGE_DAYS = 550/);
  assert.match(api, /fetchCurrentSecFacts/);
  assert.match(api, /data\.sec\.gov\/api\/xbrl\/companyfacts/);
  assert.match(api, /Current SEC Company Facts/);
  assert.match(metrics, /evToEbitda/);
  assert.match(metrics, /currentRatio/);
  assert.match(secMetrics, /depreciation_amortization/);
  assert.match(secMetrics, /current_assets/);
  assert.match(navigation, /href="\/comps"/);
  assert.match(layout, /Build a comp table/);
  assert.match(styles, /\.custom-comp-table/);
  assert.match(styles, /position:sticky;left:0/);
});

test("loads homepage market data with one cached Nasdaq bulk request", async () => {
  const [quotes, route, favicon, serviceWorker] = await Promise.all([
    source("app/market-quotes.ts"),
    source("app/api/market-snapshot/route.ts"),
    source("app/favicon.ico/route.ts"),
    source("public/sw.js"),
  ]);
  assert.match(quotes, /api\/screener\/stocks/);
  assert.match(quotes, /fetchNasdaqScreenerQuotes/);
  assert.match(quotes, /replaceAll\("\."\s*,\s*"\/"\)/);
  assert.match(quotes, /AbortSignal\.timeout/);
  assert.match(route, /const MAX_TICKERS = 20/);
  assert.match(favicon, /image\/svg\+xml/);
  assert.match(serviceWorker, /self\.clients\.claim/);
});

test("publishes a crawler sitemap for every completed dossier and protects private account routes", async () => {
  const [sitemap, companySitemap, repository, robots] = await Promise.all([
    source("app/sitemap.xml/route.ts"),
    source("app/sitemaps/companies.xml/route.ts"),
    source("db/publishedDossier.ts"),
    source("app/robots.txt/route.ts"),
  ]);
  assert.match(sitemap, /sitemaps\/companies\.xml/);
  assert.match(companySitemap, /listPublishedDossierSitemapEntries/);
  assert.match(companySitemap, /companySlug\(ticker\)/);
  assert.match(repository, /isIndexablePublishedDossier/);
  assert.match(repository, /quality_tier<>'starting_point'/);
  assert.match(repository, /COUNT\(\*\).*dossier_sources/s);
  assert.match(sitemap, /https:\/\/learnwhatyouown\.com/);
  assert.match(robots, /User-agent: OAI-SearchBot/);
  assert.match(robots, /Sitemap: https:\/\/learnwhatyouown\.com\/sitemap\.xml/);
  for (const path of ["account", "admin", "api/", "login", "messages", "notebook", "portfolio", "watchlist", "workspace"]) {
    assert.match(robots, new RegExp(`Disallow: \/${path.replace("/", "\\/")}`));
  }
});

test("canonicalizes public pages and gives company dossiers unique indexable metadata", async () => {
  const [worker, home, company, coreSitemap, auditScript] = await Promise.all([
    source("worker/index.ts"),
    source("app/page.tsx"),
    source("app/company/[ticker]/page.tsx"),
    source("app/sitemaps/core.xml/route.ts"),
    source("scripts/audit-public-seo.mjs"),
  ]);
  assert.match(worker, /isInsecureCanonicalOrigin/);
  assert.match(worker, /Response\.redirect\(canonicalUrl, 308\)/);
  assert.match(worker, /rel=\\"canonical\\"/);
  assert.match(worker, /x-robots-tag/);
  assert.match(home, /alternates: \{ canonical: canonicalUrl \}/);
  assert.match(home, /"@type": "Organization"/);
  assert.match(home, /"@type": "WebSite"/);
  assert.match(company, /export async function generateMetadata/);
  assert.match(company, /Stock Research, SEC Filings & Valuation/);
  assert.match(company, /robots: indexable \? \{ index: true/);
  assert.match(company, /"@type": "BreadcrumbList"/);
  assert.doesNotMatch(coreSitemap, /"\/russell-2000"/);
  assert.match(auditScript, /sitemap URLs must not redirect or fail/);
  assert.match(auditScript, /has no matching self-canonical/);
});

test("publishes concise company search metadata and structured index research hubs", async () => {
  const [company, structuredData, sp500, russell2000, russell3000, nasdaq100] = await Promise.all([
    source("app/company/[ticker]/page.tsx"),
    source("app/ResearchUniverseStructuredData.tsx"),
    source("app/research/sp-500/page.tsx"),
    source("app/research/russell-2000/page.tsx"),
    source("app/research/russell-3000/page.tsx"),
    source("app/research/nasdaq-100/page.tsx"),
  ]);
  assert.match(company, /companySeoTitle/);
  assert.match(company, /candidate\.length <= 65/);
  assert.match(company, /companySeoDescription/);
  assert.match(company, /candidate\.length <= 160/);
  assert.match(company, /mainEntityOfPage/);
  assert.match(structuredData, /"@type": "CollectionPage"/);
  assert.match(structuredData, /"@type": "BreadcrumbList"/);
  for (const page of [sp500, russell2000, russell3000, nasdaq100]) assert.match(page, /ResearchUniverseStructuredData/);
});

test("keeps the redirect-only Sites mirror detached from D1", async () => {
  const [hosting, packager, verifier, worker] = await Promise.all([
    source(".openai/hosting.json"),
    source("scripts/package-sites-release.mjs"),
    source("scripts/verify-sites-archive.mjs"),
    source("worker/index.ts"),
  ]);
  assert.match(hosting, /"d1": "DB"/);
  assert.match(packager, /sitesHostingConfig\.d1 = null/);
  assert.match(verifier, /Redirect-only Sites archive must not contain D1 migrations/);
  assert.match(worker, /if \(canonicalUrl\) return Response\.redirect\(canonicalUrl, 308\)/);
  assert.doesNotMatch(worker, /x-lwyo-sites-mirror/);
});

test("separates public valuation evidence from private analyst judgment", async () => {
  const [panel, workspace, api, migration, robots, accountExport] = await Promise.all([
    source("app/HistoricalValuationPanel.tsx"),
    source("app/workspace/AnalystWorkspaceClient.tsx"),
    source("app/api/analyst-workspace/route.ts"),
    source("supabase/migrations/20260805020000_institutional_analyst_workspace.sql"),
    source("app/robots.txt/route.ts"),
    source("app/api/account/export/route.ts"),
  ]);
  assert.match(panel, /Point-in-time trailing multiples/);
  assert.match(panel, /Public facts/);
  assert.match(panel, /Your private judgment/);
  assert.match(workspace, /PRIVATE ANALYST WORKSPACE/);
  assert.match(workspace, /Private records are never published automatically/);
  assert.match(api, /requireSupabaseUser/);
  assert.match(migration, /enable row level security/g);
  assert.match(migration, /auth\.uid\(\) = user_id/g);
  assert.match(migration, /revoke all[\s\S]*from anon/);
  assert.match(robots, /Disallow: \/workspace/);
  assert.match(accountExport, /analystDecisionJournal/);
});

test("implements the FACTS methodology with private row-level security and public evidence links", async () => {
  const [factsPage, screener, publicPanel, featured, starter, workspace, api, migration, navigation, sitemap, styles] = await Promise.all([
    source("app/facts/page.tsx"),
    source("app/facts/FactsScreener.tsx"),
    source("app/PublicFactsPanel.tsx"),
    source("app/FeaturedCompanyDossier.tsx"),
    source("app/company/[ticker]/page.tsx"),
    source("app/workspace/FactsWorkspace.tsx"),
    source("app/api/analyst-workspace/route.ts"),
    source("supabase/migrations/20260805030000_facts_investment_workflow.sql"),
    source("app/ui.tsx"),
    source("app/sitemaps/core.xml/route.ts"),
    source("app/globals.css"),
  ]);
  assert.match(factsPage, /Financial, Accounting, Credibility, Timing, and Sector/);
  assert.match(factsPage, /Generate ideas/);
  assert.match(factsPage, /Investigate/);
  assert.match(screener, /sort: "market_cap", direction: "desc"/);
  assert.match(screener, /membership/);
  assert.match(screener, /minMarketCap/);
  assert.match(publicPanel, /Public evidence map/);
  assert.match(publicPanel, /Private member workflow/);
  assert.match(featured, /PublicFactsPanel/);
  assert.match(starter, /PublicFactsPanel/);
  assert.match(workspace, /FACTS DUE DILIGENCE/);
  assert.match(workspace, /MANAGEMENT CREDIBILITY LEDGER/);
  assert.match(workspace, /PRIVATE INVESTIGATION LOG/);
  assert.match(workspace, /DECISION POSTMORTEM/);
  for (const action of ["save_facts", "save_action_plan", "save_commitment", "save_channel_check", "add_postmortem"]) {
    assert.match(api, new RegExp(action));
  }
  for (const table of ["analyst_facts_assessments", "analyst_management_commitments", "analyst_channel_checks", "analyst_postmortems"]) {
    assert.match(migration, new RegExp(`create table if not exists public\\.${table}`));
  }
  assert.match(migration, /enable row level security/g);
  assert.match(migration, /auth\.uid\(\) = user_id/g);
  assert.match(migration, /revoke all[\s\S]*from anon/);
  assert.match(navigation, /href="\/facts"/);
  assert.match(sitemap, /"\/facts"/);
  assert.match(styles, /\.facts-assessment-grid/);
  assert.match(styles, /\.facts-screen-row/);
});

test("keeps the deployment authority endpoint out of shared caches", async () => {
  const stats = await source("app/api/site-stats/route.ts");
  assert.match(stats, /cache-control": "no-store, max-age=0/);
  assert.doesNotMatch(stats, /stale-while-revalidate/);
});

test("publishes an internally linked, evidence-first investor education cluster", async () => {
  const [hub, guidePage, guides, navigation, layout, sitemap, styles] = await Promise.all([
    source("app/learn/page.tsx"),
    source("app/learn/[slug]/page.tsx"),
    source("app/learn/guides.ts"),
    source("app/ui.tsx"),
    source("app/layout.tsx"),
    source("app/sitemaps/learn.xml/route.ts"),
    source("app/globals.css"),
  ]);

  for (const slug of ["how-to-research-a-stock", "how-to-read-a-10-k", "how-to-evaluate-insider-trading", "how-to-compare-stocks", "how-to-understand-stock-ownership"]) {
    assert.match(guides, new RegExp(`slug: "${slug}"`));
  }
  assert.match(hub, /Owner education/i);
  assert.match(guidePage, /Learn What You Own Research/);
  assert.match(guidePage, /"@type": "Article"/);
  assert.match(guidePage, /"@type": "BreadcrumbList"/);
  assert.match(guidePage, /For research and education only/);
  assert.match(navigation, /href="\/learn"/);
  assert.match(layout, /Learn to research stocks/);
  assert.match(sitemap, /learningGuides/);
  assert.match(sitemap, /learn\/\$\{guide\.slug\}/);
  assert.match(styles, /\.learning-guide-layout/);
});

test("enforces the AMC dossier standard across completed dossiers and keeps company releases separate from SEC filings", async () => {
  const [newsRoute, newsPanel, upgrades, validator, migration, styles] = await Promise.all([
    source("app/api/company-news/route.ts"),
    source("app/CompanyNewsPanel.tsx"),
    source("app/data/featuredDossierUpgrades.ts"),
    source("scripts/validate-featured-dossiers.ts"),
    source("drizzle/0013_sync-featured-dossiers-and-pltr-facts.sql"),
    source("app/globals.css"),
  ]);

  assert.match(newsRoute, /companyReleases/);
  assert.match(newsRoute, /secFilings/);
  assert.match(newsRoute, /parsePalantirNewsroom/);
  assert.match(newsRoute, /curatedCompanyReleases/);
  assert.match(newsPanel, /Official company releases/);
  assert.match(newsPanel, /PRIMARY · REGULATORY/);
  assert.match(newsPanel, /Open Exact SEC Filing/);
  assert.match(upgrades, /https:\/\/investors\.palantir\.com\/news/);
  assert.match(newsRoute, /GetPressReleaseList/);
  assert.match(newsRoute, /Palantir Investor Relations/);
  assert.match(newsRoute, /isIndependentCoverage/);
  assert.match(newsRoute, /corporateReleasePublishers/);
  assert.match(newsRoute, /isArchiveOrFiling/);
  assert.match(newsRoute, /q4OfficialNews/);
  assert.match(newsRoute, /attributedCards/);
  assert.match(newsRoute, /indexedOfficialNews/);
  assert.match(newsRoute, /verifiedOfficialNewsrooms/);
  assert.match(newsRoute, /parseSecFiledPressReleases/);
  assert.match(await source("app/data/secNews.ts"), /SEC EDGAR Exhibit 99/);
  assert.match(newsRoute, /sec-filed-release/);
  assert.match(newsRoute, /isCleanCompanyRelease/);
  assert.match(newsRoute, /hasUsableDate/);
  assert.match(newsRoute, /retryOnce/);
  assert.match(newsRoute, /tradingViewNews/);
  assert.match(newsRoute, /news-headlines\.tradingview\.com\/headlines/);
  assert.match(newsRoute, /investor\.sandisk\.com\/news-events\/news-releases/);
  assert.match(newsRoute, /ir\.thermofisher\.com\/investors\/news-events\/news\/default\.aspx/);
  assert.match(validator, /official newsroom/);
  assert.match(validator, /SEC source/);
  assert.match(validator, /company source/);
  assert.match(migration, /'PLTR', 'success'/);
  assert.match(migration, /'PLTR', 'published'/);
  assert.match(styles, /\.admin-verification-actions button\{width:100%/);
});

test("publishes complete S&P 500 dossier coverage in descending market-cap batches", async () => {
  const [registry, batch01Dossiers, batch02Dossiers, batch03Dossiers, batch04Dossiers, batch05Dossiers, batch06Dossiers, batches, page, navigation, secCompanies] = await Promise.all([
    source("app/data/featuredDossiers.ts"),
    source("app/data/sp500Batch01Dossiers.ts"),
    source("app/data/sp500Batch02Dossiers.ts"),
    source("app/data/sp500Batch03Dossiers.ts"),
    source("app/data/sp500Batch04Dossiers.ts"),
    source("app/data/sp500Batch05Dossiers.ts"),
    source("app/data/sp500Batch06Dossiers.ts"),
    source("app/data/sp500DossierBatches.ts"),
    source("app/research/batches/page.tsx"),
    source("app/ui.tsx"),
    source("app/data/secCompanies.generated.ts"),
  ]);

  assert.match(registry, /Object\.assign\(featuredDossiers, sp500Batch01Dossiers\)/);
  assert.match(registry, /Object\.assign\(featuredDossiers, sp500Batch02Dossiers\)/);
  assert.match(registry, /Object\.assign\(featuredDossiers, sp500Batch03Dossiers\)/);
  assert.match(registry, /Object\.assign\(featuredDossiers, sp500Batch04Dossiers\)/);
  assert.match(registry, /Object\.assign\(featuredDossiers, sp500Batch05Dossiers\)/);
  assert.match(registry, /Object\.assign\(featuredDossiers, sp500Batch06Dossiers\)/);
  assert.match(registry, /featuredDossiers\.GOOGL/);
  for (const ticker of ["AVGO", "BRK.B", "LLY", "MU", "JPM", "WMT", "V", "XOM", "JNJ", "MA", "INTC", "ABBV", "CSCO", "BAC", "COST", "AMAT", "CVX", "UNH", "KO", "LRCX", "GE"]) {
    assert.match(batch01Dossiers, new RegExp(`ticker: "${ticker.replace(".", "\\.")}"`));
  }
  for (const ticker of ["PG", "NFLX", "RTX", "PANW", "GEV", "ANET", "TMO", "IBM", "CRWD", "DIS", "QCOM", "UBER", "LMT", "ISRG", "SPGI", "NOW", "MO"]) {
    assert.match(batch02Dossiers, new RegExp(`ticker:\s*"${ticker}"`));
  }
  for (const ticker of ["FTNT", "HWM", "ADBE", "ABNB", "VRT", "HOOD", "REGN", "DLR", "SNPS", "NKE", "NXPI", "O"]) {
    assert.match(batch03Dossiers, new RegExp(`"${ticker}"`));
  }
  for (const ticker of ["TEL", "CTVA", "F", "TER", "NDAQ", "EA", "PYPL", "COIN", "AXON", "VEEV", "ON", "JBL"]) {
    assert.match(batch04Dossiers, new RegExp(`"${ticker}"`));
  }
  for (const ticker of ["LVS", "ZTS", "GEHC", "FISV", "VICI", "Q", "FICO", "FOXA", "HPQ", "MRNA", "FSLR", "SBAC"]) {
    assert.match(batch05Dossiers, new RegExp(`"${ticker}"`));
  }
  for (const ticker of ["EVRG", "CDW", "SMCI", "FDXF", "NWSA", "SOLV", "LULU", "BF.B", "MGM", "TTD", "BLDR"]) {
    assert.match(batch06Dossiers, new RegExp(`"${ticker.replace(".", "\\.")}"`));
  }
  assert.match(batches, /\[30, "GE", "GE Aerospace"/);
  assert.match(batches, /"PG", "HD", "MS", "MRK", "NFLX"/);
  assert.match(batches, /rank: index \+ 31/);
  assert.match(batches, /sp500DossierBatchAsOf = "July 30, 2026"/);
  assert.match(page, /Full S&amp;P 500 coverage/);
  assert.match(page, /Batches 01–06 · 503 component ticker rows covered/);
  assert.match(page, /Ranks 401–497 by market cap/);
  assert.match(page, /Alphabet’s two share classes share one company dossier/);
  assert.match(navigation, /<summary>Research<\/summary>/);
  assert.match(navigation, /href="\/research\/sp-500">S&amp;P 500 dossiers/);
  assert.match(navigation, /href="\/research\/nasdaq-100">Nasdaq-100 dossiers/);
  assert.match(navigation, /href="\/research\/russell-3000">Russell 3000 dossiers/);
  assert.match(navigation, /href="\/research\/russell-2000">Russell 2000 dossiers/);
  assert.match(secCompanies, /normalizedTicker === "XOM"/);
  assert.match(secCompanies, /cik: "0000034088", name: "Exxon Mobil Corporation"/);
});

test("explains S&P constituent ticker lines and publishes the FACTS source PDF", async () => {
  const [directory, factsPage, learnPage, styles] = await Promise.all([
    source("app/CompanyUniverseDirectory.tsx"),
    source("app/facts/page.tsx"),
    source("app/learn/page.tsx"),
    source("app/globals.css"),
  ]);

  assert.match(directory, /500 companies, represented by constituent ticker lines/);
  assert.match(directory, /multiple share classes can make the ticker count greater than 500/);
  assert.match(directory, /constituent ticker lines currently matched/);
  assert.match(factsPage, /Read the original FACTS methodology/);
  assert.match(factsPage, /fundamental-investing-facts-methodology-kai-tao\.pdf/);
  assert.match(learnPage, /Investigative Investing and the FACTS methodology/);
  assert.match(styles, /\.facts-publication/);

  const pdf = await readFile(new URL("public/research/fundamental-investing-facts-methodology-kai-tao.pdf", root));
  assert.equal(pdf.subarray(0, 4).toString(), "%PDF");
  assert.ok(pdf.length > 100_000);
});

test("shows data-driven company logos with persistent ticker labels across dossiers and index cards", async () => {
  const [logo, featured, starter, directory, batches, home, styles, nextConfig] = await Promise.all([
    source("app/CompanyLogo.tsx"),
    source("app/FeaturedCompanyDossier.tsx"),
    source("app/company/[ticker]/page.tsx"),
    source("app/CompanyUniverseDirectory.tsx"),
    source("app/research/batches/page.tsx"),
    source("app/page.tsx"),
    source("app/globals.css"),
    source("next.config.ts"),
  ]);

  assert.match(logo, /financialmodelingprep\.com\/image-stock/);
  assert.match(logo, /replaceAll\("\."\s*,\s*"-"\)/);
  assert.match(logo, /onError=\{\(\) => setFailedSymbol\(symbol\)\}/);
  assert.match(logo, /needsDarkLogoBackground/);
  assert.match(logo, /brightnessTotal \/ visibleWeight >= 205/);
  assert.match(logo, /brightWeight \/ visibleWeight >= 0\.6/);
  assert.match(logo, /crossOrigin="anonymous"/);
  assert.match(logo, /onLoad=\{\(event\) => detectContrast\(event\.currentTarget\)\}/);
  assert.match(logo, /<small>\{normalizedTicker\}<\/small>/);
  assert.match(logo, /\? <img/);
  assert.doesNotMatch(logo, /import Image from "next\/image"/);
  assert.match(featured, /<CompanyLogo ticker=\{company\.ticker\}[^>]*size="hero"/);
  assert.match(starter, /<CompanyLogo ticker=\{company\.ticker\}[^>]*size="hero"/);
  assert.match(directory, /<CompanyLogo ticker=\{company\.ticker\}/);
  assert.match(batches, /<CompanyLogo ticker=\{company\.ticker\}/);
  assert.match(home, /<CompanyLogo ticker=\{company\.ticker\}[^>]*size="card"/);
  assert.match(styles, /\.company-logo-image img/);
  assert.match(styles, /\.company-logo-hero/);
  assert.match(styles, /\.company-logo-light-artwork \.company-logo-image/);
  assert.match(nextConfig, /financialmodelingprep\.com/);
  assert.match(nextConfig, /unoptimized: true/);
});

test("uses authoritative live homepage coverage and deduplicated primary-source counts", async () => {
  const [home, statsRoute, styles, deploy, authority, architecture] = await Promise.all([
    source("app/page.tsx"),
    source("app/api/site-stats/route.ts"),
    source("app/globals.css"),
    source("scripts/deploy-production.mjs"),
    source("scripts/verify-authority-parity.mjs"),
    source("docs/ARCHITECTURE.md"),
  ]);

  assert.match(home, /fetch\("\/api\/site-stats"\)/);
  assert.match(home, /researchableSymbols/);
  assert.match(home, /uniquePrimarySources/);
  assert.match(home, /sourceCountsByTicker\[company\.ticker\]/);
  assert.match(home, /\/api\/universe\?market=\$\{market\}/);
  assert.doesNotMatch(home, /8,903/);
  assert.doesNotMatch(home, /researchUniverse\.length\.toLocaleString/);
  assert.match(statsRoute, /companies WHERE is_active=1/);
  assert.match(statsRoute, /sec-accession:/);
  assert.match(statsRoute, /COUNT\(DISTINCT source_key\)/);
  assert.match(statsRoute, /cd\.status = 'published'/);
  assert.match(statsRoute, /featuredDossiers/);
  assert.match(statsRoute, /Math\.max\(sourceCountsByTicker\[ticker\] \?\? 0/);
  assert.match(statsRoute, /releaseCommit: runtimeEnv\.RELEASE_COMMIT_SHA/);
  assert.match(deploy, /verify-authority-parity\.mjs/);
  assert.match(authority, /learnwhatyouown\.com\/api\/site-stats/);
  assert.match(authority, /learn-what-you-own\.kaitehtao\.workers\.dev\/api\/site-stats/);
  assert.match(authority, /does not match.*production is reading more than one data authority/);
  assert.match(architecture, /Sites project must never attach `learnwhatyouown\.com`/);
  assert.doesNotMatch(architecture, /generated build config currently uses the package name `site-creator-vinext-starter`/);
  assert.match(styles, /\.proof-definition\{/);
});

test("keeps filed facts, editorial claims, and company relationships as separate public records", async () => {
  const [schema, migration] = await Promise.all([
    source("db/schema.ts"),
    source("drizzle/0002_polite_betty_brant.sql"),
  ]);

  assert.match(schema, /export const filingFacts/);
  assert.match(schema, /export const dossierClaims/);
  assert.match(schema, /export const companyRelationships/);
  assert.match(schema, /"verified_fact", "company_statement", "editorial_analysis"/);
  assert.match(schema, /supplierTicker/);
  assert.match(schema, /customerTicker/);
  assert.match(migration, /CREATE TABLE `filing_facts`/);
  assert.match(migration, /CREATE TABLE `company_relationships`/);
  assert.match(migration, /company_relationship_contribution_idx/);
});

test("publishes only moderated relationship research to the D1 graph", async () => {
  const [publicResearchRoute, moderationRoute, contributionRoute, supabaseMigration] = await Promise.all([
    source("app/api/research/route.ts"),
    source("app/api/admin/contributions/route.ts"),
    source("app/api/contributions/route.ts"),
    source("supabase/migrations/20260731010000_relationship_contributions.sql"),
  ]);

  assert.match(publicResearchRoute, /companyRelationships/);
  assert.match(publicResearchRoute, /dossierClaims\.status, "published"/);
  assert.match(moderationRoute, /payload\.status === "approved"/);
  assert.match(moderationRoute, /publishRelationship/);
  assert.match(contributionRoute, /Supplier \/ customer relationship/);
  assert.match(supabaseMigration, /relationship_direction/);
  assert.match(supabaseMigration, /supplier_to_company/);
  assert.match(supabaseMigration, /company_to_customer/);
});

test("moderates public research reports, earnings models, collaborative Google Sheets, and supporting links", async () => {
  const [client, contributionRoute, uploadRoute, publicAssetRoute, moderation, community, migration, linksMigration] = await Promise.all([
    source("app/contribute/ContributionClient.tsx"),
    source("app/api/contributions/route.ts"),
    source("app/api/contributions/assets/route.ts"),
    source("app/api/contribution-assets/[id]/route.ts"),
    source("app/admin/ModerationClient.tsx"),
    source("app/CommunityInsights.tsx"),
    source("supabase/migrations/20260802010000_public_contribution_research_assets.sql"),
    source("supabase/migrations/20260821000000_contribution_relevant_links.sql"),
  ]);

  assert.match(client, /Earnings model/);
  assert.match(client, /Research report/);
  assert.match(client, /GOOGLE SHEET URL/);
  assert.match(uploadRoute, /contributionAssetDescriptor/);
  assert.match(uploadRoute, /20 MB or smaller/);
  assert.match(contributionRoute, /normalizeGoogleSheetUrl/);
  assert.match(contributionRoute, /status === "approved"/);
  assert.match(publicAssetRoute, /contribution\.status !== "approved"/);
  assert.match(moderation, /Review uploaded file/);
  assert.match(moderation, /Review collaborative Google Sheet/);
  assert.match(community, /sandbox="allow-scripts allow-same-origin allow-forms allow-popups"/);
  assert.match(community, /COMMUNITY RESEARCH ASSET/);
  assert.match(client, /RELEVANT LINKS · OPTIONAL/);
  assert.match(contributionRoute, /normalizeRelevantLinks/);
  assert.match(moderation, /Relevant supporting links/);
  assert.match(community, /community-relevant-links/);
  assert.match(linksMigration, /relevant_links/);
  assert.match(linksMigration, /jsonb_array_length\(relevant_links\) <= 5/);
  assert.match(migration, /public = false/);
  assert.match(migration, /contribution-research-assets/);
  assert.match(migration, /editor.*admin/);
});

test("renders the research foundation on featured, starter, and ONDS dossier pages", async () => {
  const [panel, featured, starter, ondas] = await Promise.all([
    source("app/ResearchFoundationPanel.tsx"),
    source("app/FeaturedCompanyDossier.tsx"),
    source("app/company/[ticker]/page.tsx"),
    source("app/company/onds/page.tsx"),
  ]);

  assert.match(panel, /PUBLIC FILING FACTS/);
  assert.match(panel, /BUSINESS RELATIONSHIP GRAPH/);
  assert.match(panel, /DOSSIER LAST UPDATED/);
  assert.match(panel, /SEC facts refreshed/);
  assert.match(panel, /relatedTicker[\s\S]*\/company\//);
  assert.match(featured, /editorialUpdatedAt=\{dossier\.reviewed/);
  assert.match(featured, /DOSSIER LAST UPDATED/);
  assert.match(starter, /<ResearchFoundationPanel/);
  assert.match(ondas, /FeaturedCompanyDossier/);
  assert.match(ondas, /featuredDossiers\.ONDS/);
});

test("publishes flagship-depth SPCX and TSLA owner dossiers with SEC-grounded official archives", async () => {
  const [registry, spcx, tsla, newsRoute, featured, factsMigration] = await Promise.all([
    source("app/data/featuredDossiers.ts"),
    source("app/data/spcxDossier.ts"),
    source("app/data/tslaDossier.ts"),
    source("app/api/company-news/route.ts"),
    source("app/FeaturedCompanyDossier.tsx"),
    source("drizzle/0011_seed-spcx-tsla-sec-facts.sql"),
  ]);

  assert.match(registry, /featuredDossiers\.SPCX = spcxDossier/);
  assert.match(registry, /featuredDossiers\.TSLA = tslaDossier/);
  for (const dossier of [spcx, tsla]) {
    assert.match(dossier, /completeness: 100/);
    assert.match(dossier, /newsroomFeedUrl: secFeed/);
    assert.match(dossier, /financialDrivers: \[/);
    assert.match(dossier, /risks: \[/);
    assert.match(dossier, /comparables: \[/);
    assert.match(dossier, /performance: \{/);
    assert.match(dossier, /sources: \[/);
  }
  assert.match(spcx, /SpaceX Final IPO Prospectus/);
  assert.match(spcx, /\$20\.737B capex/);
  assert.match(tsla, /Tesla Second-Quarter 2026 Form 10-Q/);
  assert.match(tsla, />\$25B capex expected/);
  assert.match(spcx, /Return since first close/);
  assert.match(tsla, /2026 YTD share-price return/);
  assert.match(newsRoute, /<entry\\b\[\\s\\S\]\*\?<\\\/entry>/);
  assert.match(newsRoute, /SEC EDGAR official filing/);
  assert.match(featured, /SpaceX \(Space Exploration Technologies Corp\.\)/);
  assert.match(featured, /Tesla, Inc\./);
  assert.match(factsMigration, /'SPCX', 'no_compatible_facts'/);
  assert.match(factsMigration, /'TSLA', 'success'.*272, 14/);
  assert.match(factsMigration, /'SPCX', 'published'/);
  assert.match(factsMigration, /'TSLA', 'published'/);
});

test("adds sector-aware external intelligence with moderated public evidence", async () => {
  const [registry, panel, featured, starter, ondas, contributionClient, contributionRoute, schema, migration] = await Promise.all([
    source("app/data/externalIntelligence.ts"),
    source("app/ExternalIntelligencePanel.tsx"),
    source("app/FeaturedCompanyDossier.tsx"),
    source("app/company/[ticker]/page.tsx"),
    source("app/company/onds/page.tsx"),
    source("app/contribute/ContributionClient.tsx"),
    source("app/api/contributions/route.ts"),
    source("db/schema.ts"),
    source("drizzle/0009_external_intelligence.sql"),
  ]);

  for (const sourceName of ["USAspending.gov", "USPTO Open Data", "EPA ECHO", "NHTSA Safety Data", "EIA Open Data", "ClinicalTrials.gov", "openFDA", "NIH RePORTER", "BLS Public Data", "Census Data API", "BEA Data API", "CFTC Commitments of Traders", "OpenAlex", "Wikidata"]) {
    assert.match(registry, new RegExp(sourceName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(panel, /FREE EXTERNAL DATA · BEYOND SEC FILINGS/);
  assert.match(panel, /research paths—not claims/);
  assert.match(panel, /VERIFY BEFORE PUBLISHING/);
  assert.match(featured, /<ExternalIntelligencePanel/);
  assert.match(starter, /<ExternalIntelligencePanel/);
  assert.ok(featured.lastIndexOf("<ExternalIntelligencePanel") > featured.lastIndexOf("<CompanyConversations"));
  assert.ok(featured.lastIndexOf("<ExternalIntelligencePanel") < featured.lastIndexOf("<AccessComparison"));
  assert.ok(starter.lastIndexOf("<ExternalIntelligencePanel") > starter.lastIndexOf('className="coverage-actions"'));
  assert.match(ondas, /FeaturedCompanyDossier/);
  assert.match(contributionClient, /External dataset observation/);
  assert.match(contributionClient, /CITE SOURCE OF SUBMITTED INFORMATION/);
  assert.match(contributionClient, /CITE PRIMARY COMPANY OR SEC SOURCE/);
  assert.match(contributionRoute, /External dataset observation/);
  assert.match(schema, /export const externalDataSources/);
  assert.match(schema, /export const externalObservations/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS `external_observations`/);
  assert.match(migration, /company_match_method/);
  assert.match(migration, /match_confidence/);
});

test("adds ticker-aware third-party research links to every company dossier", async () => {
  const [registry, panel, featured, starter, styles] = await Promise.all([
    source("app/data/externalResearchLinks.ts"),
    source("app/ExternalResearchLinks.tsx"),
    source("app/FeaturedCompanyDossier.tsx"),
    source("app/company/[ticker]/page.tsx"),
    source("app/globals.css"),
  ]);

  for (const provider of ["Yahoo Finance", "Google Finance", "TradingView", "Stocktwits", "Seeking Alpha", "Stock Analysis", "Finviz", "MarketWatch", "Earnings Whispers"]) {
    assert.match(registry, new RegExp(provider));
  }
  assert.match(panel, /SUPPLEMENTAL RESEARCH · THIRD-PARTY DESTINATIONS/);
  assert.match(panel, /third-party figures and opinions are not verified Learn What You Own claims/);
  assert.match(featured, /<ExternalResearchLinks ticker=\{company\.ticker\} exchange=\{company\.exchange\}/);
  assert.match(starter, /<ExternalResearchLinks ticker=\{company\.ticker\} exchange=\{company\.exchange\}/);
  assert.match(featured, /href="#external-research">Research links/);
  assert.match(styles, /\.external-research-link-grid/);
  assert.match(styles, /grid-template-columns:1fr/);
});

test("links the earnings calendar to Earnings Whispers as a supplemental resource", async () => {
  const earningsPage = await source("app/earnings/page.tsx");
  assert.match(earningsPage, /https:\/\/www\.earningswhispers\.com\/calendar/);
  assert.match(earningsPage, /Open Earnings Whispers calendar/);
});

test("keeps the public domains attached to the production Worker", async () => {
  const [config, architecture] = await Promise.all([
    source("vite.config.ts"),
    source("docs/ARCHITECTURE.md"),
  ]);
  assert.match(config, /pattern: "learnwhatyouown\.com\/\*", zone_name: "learnwhatyouown\.com"/);
  assert.match(config, /pattern: "www\.learnwhatyouown\.com\/\*"/);
  assert.match(config, /zone_name: "learnwhatyouown\.com"/);
  assert.doesNotMatch(config, /custom_domain: true/);
  assert.match(config, /workers_dev: true/);
  assert.match(architecture, /Public origin \| `https:\/\/learnwhatyouown\.com`/);
});

test("gives SEC and AI background work a bounded production CPU budget", async () => {
  const [config, preflight] = await Promise.all([source("vite.config.ts"), source("scripts/verify-production-config.mjs")]);
  assert.match(config, /limits: \{ cpu_ms: 30_000 \}/);
  assert.doesNotMatch(config, /cpu_ms: 100\b/);
  assert.match(preflight, /cpu_ms !== 30_000/);
  assert.doesNotMatch(preflight, /cpu_ms !== 100\b/);
});

test("locks the first A batch to ten alphabetical, SEC-sourced dossiers", async () => {
  const [claims, importRoute, factRepository] = await Promise.all([
    source("app/data/curatedDossierClaims.ts"),
    source("app/api/admin/research/import/route.ts"),
    source("app/data/secFactsRepository.ts"),
  ]);

  assert.match(claims, /firstAlphabeticalABatch = \["A", "AA", "AAL", "AAMI", "AAOI", "AAON", "AAP", "AAPL", "AAT", "ABAT"\]/);
  assert.equal((claims.match(/sourceUrl: "https:\/\/www\.sec\.gov\/Archives\/edgar\/data\//g) ?? []).length, 10);
  assert.equal((claims.match(/\n    filingType: "10-K"/g) ?? []).length, 10);
  assert.equal((claims.match(/\{ section: "business_model"/g) ?? []).length, 10);
  assert.equal((claims.match(/\{ section: "segments"/g) ?? []).length, 10);
  assert.equal((claims.match(/\{ section: "revenue_drivers"/g) ?? []).length, 10);
  assert.equal((claims.match(/\{ section: "risk_factors"/g) ?? []).length, 10);
  assert.equal((claims.match(/\{ section: "owner_watchlist"/g) ?? []).length, 10);
  assert.equal((claims.match(/whyItMatters:/g) ?? []).length, 51);
  assert.equal((claims.match(/sourceExcerpt:/g) ?? []).length, 51);

  assert.match(importRoute, /sourceHostname !== "sec\.gov"/);
  assert.match(factRepository, /const D1_FACT_BATCH_SIZE = 5/);
  assert.match(importRoute, /db\.insert\(companyDossiers\)/);
  assert.match(importRoute, /db\.insert\(dossierSources\)/);
  assert.match(importRoute, /db\.insert\(dossierClaims\)/);
  assert.match(importRoute, /dossierStatus: dossier \? "published" : "facts-only"/);
});

test("keeps private messages between verified sender and recipient accounts", async () => {
  const [migration, route, client, header] = await Promise.all([
    source("supabase/migrations/20260801000000_private_messages.sql"),
    source("app/api/messages/route.ts"),
    source("app/messages/MessagesClient.tsx"),
    source("app/ui.tsx"),
  ]);

  assert.match(migration, /create table if not exists public\.private_messages/);
  assert.match(migration, /auth\.uid\(\) = sender_id/);
  assert.match(migration, /auth\.uid\(\) = recipient_id/);
  assert.match(migration, /sender_id <> recipient_id/);
  assert.match(migration, /security definer set search_path = public/);
  assert.match(migration, /revoke all on public\.private_messages from anon, authenticated/);
  assert.match(migration, /grant execute on function public\.send_private_message/);
  assert.match(route, /requireSupabaseUser/);
  assert.match(route, /server_send_member_message/);
  assert.match(route, /server_mark_private_message_read/);
  assert.match(route, /server_delete_private_message/);
  assert.match(route, /getSupabaseAdminClient/);
  assert.doesNotMatch(route, /user\.email|profile\.email/);
  assert.match(client, /Member correspondence/);
  assert.match(client, /Send private message/);
  assert.match(client, /Reply/);
  assert.match(header, /href="\/messages"/);
});

test("keeps privileged member writes server-only and retires legacy definer RPCs", async () => {
  const [serverMigration, retirementMigration, messageRoute, accountRoute] = await Promise.all([
    source("supabase/migrations/20260802020000_server_only_member_rpcs.sql"),
    source("supabase/migrations/20260802030000_retire_legacy_definer_rpcs.sql"),
    source("app/api/messages/route.ts"),
    source("app/api/account/route.ts"),
  ]);
  assert.match(serverMigration, /set search_path = pg_catalog, public/g);
  assert.match(serverMigration, /grant execute on function public\.server_send_member_message[\s\S]*to service_role/);
  assert.match(serverMigration, /revoke all on function public\.server_update_own_profile[\s\S]*from public, anon, authenticated/);
  assert.match(retirementMigration, /alter function public\.set_updated_at\(\) set search_path = pg_catalog, public/);
  assert.match(retirementMigration, /drop function if exists public\.send_member_message/);
  assert.match(retirementMigration, /company_research_demand\(\)[\s\S]*to service_role/);
  assert.match(messageRoute, /getSupabaseAdminClient\(\)\.rpc\("server_send_member_message"/);
  assert.match(accountRoute, /admin\.rpc\("server_update_own_profile"/);
});

test("supports public member profiles, follows, and per-message visibility", async () => {
  const [migration, memberRoute, followRoute, memberClient, messageClient] = await Promise.all([
    source("supabase/migrations/20260801010000_member_following_public_messages.sql"),
    source("app/api/members/[username]/route.ts"),
    source("app/api/follows/route.ts"),
    source("app/members/[username]/MemberProfileClient.tsx"),
    source("app/messages/MessagesClient.tsx"),
  ]);

  assert.match(migration, /create table if not exists public\.member_follows/);
  assert.match(migration, /follower_id <> followed_id/);
  assert.match(migration, /auth\.uid\(\) = follower_id/);
  assert.match(migration, /visibility in \('private', 'public'\)/);
  assert.match(migration, /visibility = 'public'/);
  assert.match(migration, /send_member_message/);
  assert.match(memberRoute, /followerCount/);
  assert.match(memberRoute, /followingCount/);
  assert.match(memberRoute, /publicMessages/);
  assert.match(followRoute, /You cannot follow yourself/);
  assert.match(memberClient, /Followers/);
  assert.match(memberClient, /Following/);
  assert.match(memberClient, /Public note/);
  assert.match(messageClient, /WHO CAN SEE THIS/);
  assert.match(messageClient, /Only you and the recipient/);
  assert.match(messageClient, /Also appears on their profile/);
});

test("lets members add a public biography and validated profile photo", async () => {
  const [migration, accountRoute, photoRoute, editor, memberRoute, memberClient, styles] = await Promise.all([
    source("supabase/migrations/20260801090000_public_profile_bio_photo.sql"),
    source("app/api/account/route.ts"),
    source("app/api/account/photo/route.ts"),
    source("app/account/profile/ProfileEditorClient.tsx"),
    source("app/api/members/[username]/route.ts"),
    source("app/members/[username]/MemberProfileClient.tsx"),
    source("app/globals.css"),
  ]);

  assert.match(migration, /add column if not exists bio/);
  assert.match(migration, /add column if not exists avatar_path/);
  assert.match(migration, /length\(bio\) <= 500/);
  assert.match(migration, /'profile-photos'/);
  assert.match(migration, /3145728/);
  assert.match(accountRoute, /Biography must be 500 characters or fewer/);
  assert.match(photoRoute, /image\/jpeg/);
  assert.match(photoRoute, /MAX_PHOTO_BYTES/);
  assert.match(photoRoute, /requireSupabaseUser/);
  assert.match(photoRoute, /crypto\.randomUUID/);
  assert.match(editor, /SHORT BIOGRAPHY/);
  assert.match(editor, /Maximum 3 MB/);
  assert.match(editor, /email, phone, portfolio, watchlist, and notebook stay private/);
  assert.match(memberRoute, /approvedContributions/);
  assert.match(memberRoute, /publicProfilePhotoUrl/);
  assert.match(memberClient, /Approved contributions/);
  assert.match(memberClient, /Edit public profile/);
  assert.match(styles, /\.profile-editor-form/);
});

test("publishes moderated professional identity and a transparent correction record", async () => {
  const [migration, accountRoute, editor, memberRoute, memberClient, adminRoute, adminClient, styles] = await Promise.all([
    source("supabase/migrations/20260801100000_public_profile_research_identity.sql"),
    source("app/api/account/route.ts"),
    source("app/account/profile/ProfileEditorClient.tsx"),
    source("app/api/members/[username]/route.ts"),
    source("app/members/[username]/MemberProfileClient.tsx"),
    source("app/api/admin/dashboard/route.ts"),
    source("app/admin/AdminDashboard.tsx"),
    source("app/globals.css"),
  ]);

  assert.match(migration, /investment_style/);
  assert.match(migration, /linkedin_url/);
  assert.match(migration, /credential_status/);
  assert.match(migration, /create table if not exists public\.contribution_corrections/);
  assert.match(migration, /Published correction history is public/);
  assert.match(accountRoute, /Enter a valid LinkedIn profile URL/);
  assert.match(accountRoute, /links_status: linksChanged/);
  assert.match(accountRoute, /credential_status: credentialChanged/);
  assert.match(editor, /LINKEDIN PROFILE/);
  assert.match(editor, /INVESTMENT STYLE/);
  assert.match(editor, /CREDENTIALS FOR VERIFICATION/);
  assert.match(memberRoute, /links_status === "approved"/);
  assert.match(memberRoute, /credential_status === "verified"/);
  assert.match(memberClient, /LinkedIn profile/);
  assert.match(memberClient, /Published corrections/);
  assert.match(adminRoute, /verify_credentials/);
  assert.match(adminRoute, /approve_links/);
  assert.match(adminClient, /Verify credentials/);
  assert.match(adminClient, /Approve links/);
  assert.match(styles, /\.research-identity-card/);
});

test("distinguishes public research from verified-account tools and collects private phone details", async () => {
  const [comparison, home, login, onboarding, header] = await Promise.all([
    source("app/AccessComparison.tsx"),
    source("app/page.tsx"),
    source("app/login/page.tsx"),
    source("app/onboarding/page.tsx"),
    source("app/ui.tsx"),
  ]);

  assert.match(comparison, /WITHOUT AN ACCOUNT/);
  assert.match(comparison, /WITH A FREE ACCOUNT/);
  assert.match(comparison, /private watchlists, portfolios, and research notebooks/);
  assert.match(comparison, /Already a member\? Sign in/);
  assert.match(comparison, /Read the Founder’s Letter/);
  assert.match(home, /<AccessComparison/);
  assert.match(login, /PHONE NUMBER <em>optional<\/em>/);
  assert.match(login, /does not opt you into marketing texts/);
  assert.match(onboarding, /PHONE NUMBER <em>optional<\/em>/);
  assert.match(login, /phone_number: phoneNumber/);
  assert.match(onboarding, /sms_marketing_consent: false/);
  assert.match(onboarding, /supabase\.auth\.updateUser/);
  assert.match(header, /Create free account/);
  assert.match(header, /Member sign in/);
  assert.match(header, /Founder’s Letter/);
  assert.match(header, /menu-label/);
});

test("shows the public-vs-member benefits and founder path on every company dossier", async () => {
  const [featured, starter, ondas] = await Promise.all([
    source("app/FeaturedCompanyDossier.tsx"),
    source("app/company/[ticker]/page.tsx"),
    source("app/company/onds/page.tsx"),
  ]);
  for (const dossier of [featured, starter]) assert.match(dossier, /<AccessComparison/);
  assert.match(ondas, /FeaturedCompanyDossier/);
});

test("calculates a clean private portfolio status from shares, cost, and current quotes", async () => {
  const [page, client, route, quotes, styles, layout] = await Promise.all([
    source("app/portfolio/page.tsx"),
    source("app/portfolio/PortfolioClient.tsx"),
    source("app/api/portfolio/route.ts"),
    source("app/market-quotes.ts"),
    source("app/globals.css"),
    source("app/layout.tsx"),
  ]);

  assert.match(page, /current market value, cost basis, and unrealized gain or loss/);
  assert.match(client, /AVERAGE PURCHASE PRICE PER SHARE/);
  assert.match(client, /ESTIMATED VALUE/);
  assert.match(client, /TOTAL COST BASIS/);
  assert.match(client, /UNREALIZED GAIN \/ LOSS/);
  assert.match(client, /Market value/);
  assert.match(client, /Gain \/ loss/);
  assert.match(client, /method: editingId \? "PATCH" : "POST"/);
  assert.match(route, /POSITION_META_PREFIX/);
  assert.match(route, /serializeDetails\(notes, averageCost\)/);
  assert.match(route, /shares \* currentPrice/);
  assert.match(route, /marketValue - costBasis/);
  assert.match(route, /export async function PATCH/);
  assert.match(quotes, /api\/quote/);
  assert.match(quotes, /lastSalePrice/);
  assert.match(quotes, /revalidate: 300/);
  assert.match(styles, /\.portfolio-summary\{/);
  assert.match(styles, /\.portfolio-table-head/);
  assert.match(styles, /Resilient member workspace layouts/);
  assert.match(styles, /@media\(max-width:1480px\)\{/);
  assert.match(styles, /\.notification-bell:not\(\[open\]\) \.notification-popover\{display:none\}/);
  assert.match(styles, /\.portfolio-workspace>\.portfolio-layout\{grid-template-columns:minmax\(0,1fr\)/);
  assert.match(styles, /\.portfolio-form\{position:static;display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(styles, /\.portfolio-table\{overflow-x:auto\}/);
  assert.match(styles, /@media\(max-width:1180px\)\{\.portfolio-workspace>\.portfolio-layout\{grid-template-columns:1fr\}/);
  assert.match(styles, /\.portfolio-table \.position-row\{grid-template-columns:minmax\(220px,1\.35fr\) minmax\(120px,1fr\) minmax\(120px,1fr\);min-width:0\}/);
  assert.match(styles, /@media\(max-width:480px\)\{\.portfolio-summary\{grid-template-columns:1fr\}/);
  assert.match(styles, /\.portfolio-list,\.portfolio-table,\.portfolio-table \.position-row>\*\{min-width:0\}/);
  assert.match(layout, /export const dynamic = "force-dynamic"/);
});

test("accepts authenticated product feedback with ranked feature requests", async () => {
  const [page, client, route, voteRoute, migration, rankingMigration, schema, runtimeSchema, layout, account] = await Promise.all([
    source("app/feedback/page.tsx"),
    source("app/feedback/FeedbackClient.tsx"),
    source("app/api/feedback/route.ts"),
    source("app/api/feedback/vote/route.ts"),
    source("drizzle/0008_product_feedback.sql"),
    source("drizzle/0015_ranked_feature_requests.sql"),
    source("db/schema.ts"),
    source("db/runtimeSchema.ts"),
    source("app/layout.tsx"),
    source("app/account/AccountClient.tsx"),
  ]);

  assert.match(page, /HELP SHAPE THE PRODUCT/);
  assert.match(client, /New product feedback/);
  assert.match(client, /My feedback history/);
  assert.match(client, /Feature request/);
  assert.match(client, /Ranked feature requests/);
  assert.match(client, /One vote per verified member/);
  assert.match(client, /@Yourhost will review/);
  assert.match(route, /requireSupabaseUser/);
  assert.match(route, /Title must be 8–120 characters/);
  assert.match(route, /Details must be 30–4,000 characters/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS `product_feedback`/);
  assert.match(rankingMigration, /CREATE TABLE IF NOT EXISTS `product_feedback_votes`/);
  assert.match(rankingMigration, /product_feedback_vote_unique_idx/);
  assert.match(schema, /export const productFeedbackVotes/);
  assert.match(runtimeSchema, /ensureFeedbackVotingSchema/);
  assert.match(route, /view === "ranked"/);
  assert.match(route, /ORDER BY vote_count DESC/);
  assert.match(voteRoute, /requireSupabaseUser/);
  assert.match(voteRoute, /ON CONFLICT\(feedback_id,user_id\) DO NOTHING/);
  assert.match(voteRoute, /export async function DELETE/);
  assert.match(migration, /`status` IN \('submitted', 'reviewing', 'planned', 'completed', 'declined'\)/);
  assert.match(route, /env\.DB\.prepare/);
  assert.match(route, /WHERE user_id=\?/);
  assert.match(layout, /href="\/feedback"/);
  assert.match(account, /Product feedback/);
});

test("adds filing-grounded stock ownership to every dossier", async () => {
  const [panel, route, shareFacts, featured, starter, ondas, styles] = await Promise.all([
    source("app/StockOwnershipPanel.tsx"),
    source("app/api/ownership/route.ts"),
    source("app/data/secShareFacts.ts"),
    source("app/FeaturedCompanyDossier.tsx"),
    source("app/company/[ticker]/page.tsx"),
    source("app/company/onds/page.tsx"),
    source("app/globals.css"),
  ]);
  assert.match(panel, /Who owns/);
  assert.match(panel, /INSTITUTIONAL OWNERSHIP/);
  assert.match(panel, /ESTIMATED RETAIL \+ OTHER/);
  assert.match(panel, /PUBLIC TRADABLE FLOAT/);
  assert.match(panel, /Insider purchases/);
  assert.match(panel, /Insider sales/);
  assert.match(panel, /Purchases and sales, separated/);
  assert.match(panel, /No SEC transactions coded P were found/);
  assert.match(panel, /No SEC transactions coded S were found/);
  assert.match(panel, /this is not a zero-activity result/);
  assert.match(panel, /Reporting insiders/);
  assert.match(panel, /Beneficial owners and management/);
  assert.match(panel, /Open exact SEC proxy/);
  assert.match(panel, /Largest reporting holders/);
  assert.match(panel, /not a reported SEC retail figure/);
  assert.match(shareFacts, /EntityCommonStockSharesOutstanding/);
  assert.match(shareFacts, /CommonStockSharesOutstanding/);
  assert.match(shareFacts, /NumberOfSharesOutstanding/);
  assert.match(shareFacts, /sharesFromInlineFiling/);
  assert.match(route, /latestSharesOutstanding/);
  assert.match(route, /sourceConcept: shares\.concept/);
  assert.match(route, /EntityPublicFloat/);
  assert.match(route, /institutional-holdings/);
  assert.match(route, /secOwnershipDocuments/);
  assert.match(route, /parseSecOwnershipXml/);
  assert.match(route, /parseSecProxyOwnershipHtml/);
  assert.match(route, /latestProxyFiling/);
  assert.match(route, /beneficialOwnership:/);
  assert.match(route, /temporarily unavailable\. This does not mean the company has no insider activity/);
  assert.match(route, /purchases: insiderPurchases/);
  assert.match(route, /sales: insiderSales/);
  assert.match(route, /Transaction code P is classified as a purchase and S as a sale/);
  assert.match(route, /forms=3%2C4%2C5/);
  assert.match(featured, /StockOwnershipPanel/);
  assert.match(featured, /href="#ownership"/);
  assert.match(starter, /StockOwnershipPanel/);
  assert.match(ondas, /FeaturedCompanyDossier/);
  assert.match(styles, /\.ownership-summary-grid/);
  assert.match(styles, /\.ownership-detail-grid/);
  assert.match(styles, /\.proxy-ownership-table/);
  assert.match(styles, /\.insider-transaction-table>a\{grid-template-columns:minmax\(220px,2fr\)/);
  assert.match(styles, /@media\(min-width:1101px\)\{\.ownership-table\.insider-transaction-table>a\{grid-template-columns:minmax\(220px,2fr\)/);
  assert.match(styles, /\.mobile-field-label\{display:none\}/);
  assert.match(styles, /\.insider-transaction-table \.ownership-table-head\{display:none\}/);
  assert.match(panel, /insider-transaction-role/);
  assert.match(panel, /insider-transaction-description/);
  assert.match(panel, /Security:/);
  assert.match(styles, /@media\(max-width:1100px\)\{\.ownership-transaction-note/);
  assert.match(styles, /@media\(max-width:430px\)\{\.insider-transaction-table>a\{grid-template-columns:1fr\}/);
  assert.match(styles, /\.ownership-detail-grid>section\{min-width:0\}/);
  assert.match(styles, /@media\(max-width:1400px\)\{\.ownership-detail-grid\{grid-template-columns:1fr\}\}/);
  assert.match(styles, /@media\(max-width:1100px\)\{\.ownership-detail-grid \.ownership-table\{overflow:visible\}/);
  assert.match(styles, /\.ownership-detail-grid \.ownership-table>a\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\);min-width:0/);
  assert.match(styles, /\.ownership-table-head,\.ownership-table>a\{display:grid;grid-template-columns:minmax\(0,1\.5fr\) minmax\(0,\.8fr\) minmax\(0,\.9fr\) minmax\(0,\.8fr\);gap:12px;min-width:0/);
  assert.match(panel, /Latest reported shares<\/small>/);
  assert.match(panel, /Reported shares<\/small>/);
  assert.match(panel, /transactionKind="purchase"/);
  assert.match(panel, /transactionKind="sale"/);
  assert.match(panel, /mobile-field-label/);
});

test("links the masthead search shortcut to and focuses the homepage search field", async () => {
  const [header, home, styles] = await Promise.all([
    source("app/ui.tsx"),
    source("app/page.tsx"),
    source("app/globals.css"),
  ]);

  assert.match(header, /className="search-shortcut" href="\/#company-search"/);
  assert.match(header, /Jump to company search/);
  assert.match(header, /input\?\.focus\(\{ preventScroll: true \}\)/);
  assert.match(header, />Search<\/strong>/);
  assert.match(home, /id="company-search"/);
  assert.match(home, /id="company-search-input"/);
  assert.match(home, /window\.location\.hash !== "#company-search"/);
  assert.match(styles, /\.search-shortcut\{display:inline-flex/);
});

test("keeps investment notebooks private while supporting sourced public handoff", async () => {
  const [migration, attachmentMigration, route, attachmentRoute, downloadRoute, client, captureButton, contributionPage, header] = await Promise.all([
    source("supabase/migrations/20260801020000_private_research_notebooks.sql"),
    source("supabase/migrations/20260802000000_private_research_attachments.sql"),
    source("app/api/notebook/route.ts"),
    source("app/api/notebook/attachments/route.ts"),
    source("app/api/notebook/attachments/[id]/route.ts"),
    source("app/notebook/NotebookClient.tsx"),
    source("app/SaveToNotebookButton.tsx"),
    source("app/contribute/page.tsx"),
    source("app/ui.tsx"),
  ]);

  assert.match(migration, /create table if not exists public\.research_notebooks/);
  assert.match(migration, /create table if not exists public\.research_notes/);
  assert.match(migration, /auth\.uid\(\)/);
  assert.match(migration, /revoke all on public\.research_notebooks from anon/);
  assert.match(migration, /revoke all on public\.research_notes from anon/);
  assert.match(attachmentMigration, /create table if not exists public\.research_attachments/);
  assert.match(attachmentMigration, /private-research-files/);
  assert.match(attachmentMigration, /auth\.uid\(\) = user_id/);
  assert.match(attachmentMigration, /allowed_mime_types = excluded\.allowed_mime_types/);
  assert.match(route, /requireSupabaseUser/);
  assert.match(route, /research_attachments/);
  assert.match(route, /Choose a ticker from the research universe/);
  assert.match(route, /Source URL must begin with http:\/\/ or https:\/\//);
  assert.match(attachmentRoute, /MAX_PDF_BYTES = 20 \* 1024 \* 1024/);
  assert.match(attachmentRoute, /isPdfSignature/);
  assert.match(attachmentRoute, /\.eq\("user_id", profile\.user_id\)/);
  assert.match(attachmentRoute, /PRIVATE_RESEARCH_BUCKET/);
  assert.match(downloadRoute, /createSignedUrl/);
  assert.match(downloadRoute, /\.eq\("user_id", profile\.user_id\)/);
  assert.match(client, /PRIVATE BY DEFAULT/);
  assert.match(client, /PRIVATE FILES &amp; LINKS/);
  assert.match(client, /Upload PDF/);
  assert.match(client, /Private link/);
  assert.match(client, /ONE-SENTENCE WORKING THESIS/);
  assert.match(client, /Prepare public contribution/);
  assert.match(client, /setTimeout[\s\S]*850/);
  assert.match(captureButton, /action: "capture"/);
  assert.match(contributionPage, /initialDraft/);
  assert.match(header, /href="\/notebook"/);
});

test("supports ticker-free private-company profiles with venture operating and ownership history", async () => {
  const [migration, notebookRoute, privateRoute, privateClient, notebookClient] = await Promise.all([
    source("supabase/migrations/20260808051624_private_company_research_profiles.sql"),
    source("app/api/notebook/route.ts"),
    source("app/api/notebook/private-company/route.ts"),
    source("app/notebook/private-company/[id]/PrivateCompanyNotebookClient.tsx"),
    source("app/notebook/NotebookClient.tsx"),
  ]);

  assert.match(migration, /alter column ticker drop not null/);
  assert.match(migration, /company_kind = 'private' and ticker is null/);
  assert.match(migration, /create table if not exists public\.private_company_metrics/);
  assert.match(migration, /create table if not exists public\.private_company_funding_rounds/);
  assert.match(migration, /create table if not exists public\.private_company_cap_table_entries/);
  assert.match(migration, /\(select auth\.uid\(\)\) = user_id/);
  assert.match(migration, /n\.company_kind = ''private''/);
  assert.match(notebookRoute, /create_private_notebook/);
  assert.match(notebookRoute, /ticker: null, company_kind: "private"/);
  assert.match(privateRoute, /requireSupabaseUser/);
  assert.match(privateRoute, /private_company_metrics/);
  assert.match(privateRoute, /private_company_funding_rounds/);
  assert.match(privateRoute, /private_company_cap_table_entries/);
  assert.match(privateRoute, /\.eq\("user_id", profile\.user_id\)/);
  assert.match(privateClient, /ARR, KPIs, and forecasts/);
  assert.match(privateClient, /Pre-money valuation/);
  assert.match(privateClient, /Cap table and fully diluted ownership/);
  assert.match(privateClient, /No ticker or exchange required/);
  assert.match(notebookClient, /Build private profile/);
});

test("publishes FCEL as a fully sourced benchmark dossier", async () => {
  const [dossier, registry] = await Promise.all([
    source("app/data/fcelDossier.ts"),
    source("app/data/featuredDossiers.ts"),
  ]);
  assert.match(registry, /featuredDossiers\.FCEL = fcelDossier/);
  assert.match(dossier, /completeness: 100/);
  assert.match(dossier, /August 2, 2026/);
  assert.match(dossier, /\$1\.14B/);
  assert.match(dossier, /Q2 GROSS MARGIN/);
  assert.match(dossier, /10,714,286 new common shares/);
  assert.match(dossier, /Siemens and FuelCell Energy collaboration/);
  assert.match(dossier, /evidenceReview/);
  assert.match(dossier, /comparables/);
});

test("creates private member notifications and opt-in email delivery", async () => {
  const [migration, route, bell, center, messages, emailDelivery, digestRoute, worker, viteConfig, header] = await Promise.all([
    source("supabase/migrations/20260801030000_member_notifications.sql"),
    source("app/api/notifications/route.ts"),
    source("app/NotificationBell.tsx"),
    source("app/notifications/NotificationsClient.tsx"),
    source("app/messages/MessagesClient.tsx"),
    source("app/email-notifications.ts"),
    source("app/api/notifications/email-digest/route.ts"),
    source("worker/index.ts"),
    source("vite.config.ts"),
    source("app/ui.tsx"),
  ]);

  assert.match(migration, /create table if not exists public\.notifications/);
  assert.match(migration, /create table if not exists public\.notification_preferences/);
  assert.match(migration, /create table if not exists public\.email_notification_outbox/);
  assert.match(migration, /auth\.uid\(\) = user_id/);
  assert.match(migration, /revoke all on public\.email_notification_outbox from anon, authenticated/);
  assert.match(migration, /insert into public\.notifications/);
  assert.match(migration, /on conflict \(user_id, entity_type, entity_id\) do nothing/);
  assert.match(route, /requireSupabaseUser/);
  assert.match(route, /read_all/);
  assert.match(route, /emailAvailable/);
  assert.match(bell, /30000/);
  assert.match(bell, /unread notifications/);
  assert.match(center, /Email delivery is awaiting provider connection/);
  assert.match(messages, /lwy:notifications-changed/);
  assert.match(emailDelivery, /The private message body is never included/);
  assert.match(emailDelivery, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(emailDelivery, /RESEND_API_KEY/);
  assert.match(emailDelivery, /if \(!due\?\.length\) return \{ recipients: 0, notifications: 0 \}/);
  assert.match(emailDelivery, /if \(!notifications\?\.length\)[\s\S]*status: "skipped"[\s\S]*No notification content available/);
  assert.doesNotMatch(emailDelivery, /messageBody|message_body/);
  assert.match(digestRoute, /NOTIFICATION_CRON_SECRET/);
  assert.match(worker, /America\/Los_Angeles/);
  assert.match(worker, /isPacificDigestHour\(controller\.scheduledTime\)/);
  assert.match(worker, /dossier-freshness\?limit=10/);
  assert.doesNotMatch(worker, /SITES_MIRROR_CRON_SECRET/);
  assert.doesNotMatch(worker, /x-lwyo-sites-mirror/);
  assert.doesNotMatch(worker, /julianspencer\.chatgpt\.site\}\$\{pathname\}/);
  assert.match(worker, /if \(canonicalUrl\) return Response\.redirect\(canonicalUrl, 308\)/);
  assert.match(worker, /handler\.fetch\(new Request/);
  assert.doesNotMatch(worker, /await fetch\(`\$\{siteUrl\}\/api\/internal\/sec-facts-refresh/);
  assert.match(worker, /\/api\/notifications\/email-digest/);
  assert.match(viteConfig, /0 15,16 \* \* \*/);
  assert.match(header, /NotificationBell/);
  assert.match(header, /href="\/notifications"/);
});

test("shows watchlist earnings dates and creates duplicate-safe seven-day alerts", async () => {
  const [calendar, verifications, watchlistApi, watchlist, alertsRoute, worker, bell, center, emailDelivery, notificationsApi] = await Promise.all([
    source("app/earnings-alerts.ts"),
    source("app/data/earningsVerifications.ts"),
    source("app/api/watchlist/route.ts"),
    source("app/watchlist/WatchlistClient.tsx"),
    source("app/api/internal/earnings-alerts/route.ts"),
    source("worker/index.ts"),
    source("app/NotificationBell.tsx"),
    source("app/notifications/NotificationsClient.tsx"),
    source("app/email-notifications.ts"),
    source("app/api/notifications/route.ts"),
  ]);

  assert.match(calendar, /ALERT_WINDOW_DAYS = 7/);
  assert.match(calendar, /api\/analyst[\s\S]*earnings-date/);
  assert.match(calendar, /verification_status: verification \? "company-confirmed"/);
  assert.match(calendar, /verification\?\.date \?\? providerDate/);
  assert.match(verifications, /ticker: "SPCX"/);
  assert.match(verifications, /date: "2026-08-04"/);
  assert.match(verifications, /SpaceX Investor Relations/);
  assert.match(calendar, /earningsAlertIdentity/);
  assert.match(calendar, /onConflict: "user_id,entity_type,entity_id"/);
  assert.match(watchlistApi, /refreshEarningsCalendar/);
  assert.match(watchlistApi, /daysUntilEarnings/);
  assert.match(watchlistApi, /Earnings alerts could not be prepared while loading the watchlist/);
  assert.match(calendar, /AbortSignal\.timeout\(4_000\)/);
  assert.match(calendar, /officialFallbackRecord/);
  assert.match(watchlist, /NEXT EARNINGS/);
  assert.match(watchlist, /7-day alert scheduled/);
  assert.match(watchlist, /Company confirmed/);
  assert.match(watchlist, /We couldn’t load your watchlist/);
  assert.match(watchlist, /Try again/);
  assert.match(alertsRoute, /NOTIFICATION_CRON_SECRET/);
  assert.match(worker, /\/api\/internal\/earnings-alerts/);
  assert.match(worker, /await deliverScheduledDigest/);
  assert.match(bell, /notification\.entityType === "earnings_alert"/);
  assert.match(center, /EARNINGS ALERT/);
  assert.match(notificationsApi, /entityType: row\.entity_type/);
  assert.match(emailDelivery, /\.in\("frequency", \["immediate", "daily"\]\)/);
});

test("builds point-in-time earnings intelligence and authenticated community whispers", async () => {
  const [calendar, route, estimates, runtime, schema, migration] = await Promise.all([
    source("app/earnings/page.tsx"),
    source("app/api/earnings/route.ts"),
    source("app/api/earnings/estimates/route.ts"),
    source("db/runtimeSchema.ts"),
    source("db/schema.ts"),
    source("drizzle/0021_earnings_intelligence.sql"),
  ]);
  assert.match(calendar, /LWYO Whisper/);
  assert.match(calendar, /Revision \+ dispersion/);
  assert.match(calendar, /Actual \+ surprise/);
  assert.match(calendar, /REVENUE ESTIMATE · USD MILLIONS/);
  assert.match(route, /recordProviderEarnings/);
  assert.match(route, /epsProviderSurprise/);
  assert.match(route, /marketCap: formatMarketCap\(parseFinancialNumber\(row\.marketCap\)\)/);
  assert.match(estimates, /requireSupabaseUser/);
  assert.match(estimates, /Estimates are locked for scoring/);
  assert.match(runtime, /ensureEarningsIntelligenceSchema/);
  assert.match(schema, /earningsConsensusSnapshots/);
  assert.match(migration, /earnings_community_estimates/);
});

test("builds a private-by-identity collaborative earnings workbook with public aggregates", async () => {
  const [calendar, page, client, route, model, migration, architecture] = await Promise.all([
    source("app/earnings/page.tsx"),
    source("app/earnings/model/[ticker]/page.tsx"),
    source("app/earnings/model/[ticker]/CollaborativeEarningsModel.tsx"),
    source("app/api/earnings/models/route.ts"),
    source("app/earnings-model.ts"),
    source("supabase/migrations/20260806234500_collaborative_earnings_models.sql"),
    source("docs/ARCHITECTURE.md"),
  ]);
  assert.match(calendar, /Build model/);
  assert.match(page, /CollaborativeEarningsModel/);
  assert.match(client, /Anonymous crowd medians/);
  assert.match(client, /Start from crowd medians/);
  assert.match(client, /Your revision history/);
  assert.match(route, /requireSupabaseUser/);
  assert.match(route, /getSupabaseAdminClient/);
  assert.match(route, /earnings_model_revisions/);
  assert.match(model, /deriveEarningsModelPeriod/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /Members own earnings model cells/);
  assert.match(migration, /revoke all[\s\S]*from anon/);
  assert.match(architecture, /collaborative earnings-model/);
});

test("lists the official Summer 2026 Y Combinator class with ranking placeholders", async () => {
  const [page, explorer, data, sitemap] = await Promise.all([
    source("app/emerging-companies/y-combinator/page.tsx"),
    source("app/emerging-companies/y-combinator/YcBatchExplorer.tsx"),
    source("app/data/ycSummer2026.json"),
    source("app/sitemaps/core.xml/route.ts"),
  ]);
  const roster = JSON.parse(data);
  assert.equal(roster.batch, "Summer 2026");
  assert.equal(roster.companies.length, 174);
  assert.equal(roster.companies.reduce((sum, company) => sum + company.founders.length, 0), 340);
  assert.ok(roster.companies.filter((company) => company.founders.length > 0).length >= 168);
  assert.match(JSON.stringify(roster.companies.find((company) => company.slug === "83-sciences")), /Ian Naccarella/);
  assert.match(page, /Explore every/);
  assert.match(explorer, /RANK · PENDING RESEARCH/);
  assert.match(explorer, /Rank evidence, not excitement/);
  assert.match(explorer, /View full starter dossier/);
  assert.match(explorer, /Founder team/);
  assert.match(explorer, /Public profile facts sourced from YC/);
  assert.match(explorer, /Full YC profile ↗/);
  assert.match(explorer, /href=\{company\.ycUrl\}/);
  assert.match(sitemap, /emerging-companies\/y-combinator/);
});

test("provides an admin-only audience and account control center", async () => {
  const [migration, verificationMigration, route, dashboard, tracker, layout, adminPage] = await Promise.all([
    source("supabase/migrations/20260801040000_admin_dashboard_analytics.sql"),
    source("supabase/migrations/20260801080000_admin_email_verification.sql"),
    source("app/api/admin/dashboard/route.ts"),
    source("app/admin/AdminDashboard.tsx"),
    source("app/VisitorTracker.tsx"),
    source("app/layout.tsx"),
    source("app/admin/page.tsx"),
  ]);

  assert.match(migration, /create table if not exists public\.site_visits/);
  assert.match(migration, /create table if not exists public\.admin_account_audit/);
  assert.match(migration, /revoke all on public\.site_visits from anon, authenticated/);
  assert.match(migration, /admin_dashboard_visitor_metrics/);
  assert.doesNotMatch(migration, /ip_address|user_agent/);
  assert.match(verificationMigration, /verification_resend/);
  assert.match(verificationMigration, /email_confirm/);
  assert.match(route, /requireAdmin/);
  assert.match(route, /inviteUserByEmail/);
  assert.match(route, /auth\.resend\(\{ type: "signup"/);
  assert.match(route, /updateUserById\(userId, \{ email_confirm: true \}\)/);
  assert.match(route, /Wait at least one minute before resending/);
  assert.match(route, /Type \$\{email\} to confirm manual verification/);
  assert.match(route, /deleteUser\(userId, false\)/);
  assert.match(route, /You cannot delete the account you are currently using/);
  assert.match(route, /The final administrator cannot be deleted/);
  assert.match(route, /admin_account_audit/);
  assert.match(dashboard, /Audience and accounts/);
  assert.match(dashboard, /Invite member/);
  assert.match(dashboard, /Resend email/);
  assert.match(dashboard, /Verify manually/);
  assert.match(dashboard, /Manual verification bypasses the user's email confirmation link/);
  assert.match(dashboard, /DELETE @/);
  assert.match(dashboard, /Visitor counts use a random first-party browser identifier/);
  assert.match(tracker, /navigator\.doNotTrack/);
  assert.match(tracker, /crypto\.randomUUID/);
  assert.match(layout, /<VisitorTracker/);
  assert.match(adminPage, /<AdminDashboard/);
});

test("moderates IPO and private-company dossiers before publishing them to D1", async () => {
  const [schema, d1Migration, supabaseMigration, contributionRoute, moderationRoute, contributionClient, directory] = await Promise.all([
    source("db/schema.ts"),
    source("drizzle/0005_emerging-companies-and-aapl-supply-chain.sql"),
    source("supabase/migrations/20260801050000_company_dossier_proposals.sql"),
    source("app/api/contributions/route.ts"),
    source("app/api/admin/contributions/route.ts"),
    source("app/contribute/ContributionClient.tsx"),
    source("app/emerging-companies/page.tsx"),
  ]);

  assert.match(schema, /export const emergingCompanyDossiers/);
  assert.match(d1Migration, /CREATE TABLE IF NOT EXISTS `emerging_company_dossiers`/);
  assert.match(supabaseMigration, /roadshow-materials/);
  assert.match(supabaseMigration, /file_size_limit/);
  assert.match(supabaseMigration, /application\/pdf/);
  assert.match(contributionRoute, /Upcoming IPO dossier/);
  assert.match(contributionRoute, /Private company dossier/);
  assert.match(moderationRoute, /publishCompanyProposal/);
  assert.match(moderationRoute, /payload\.status === "approved"/);
  assert.match(contributionClient, /UPLOAD PDF · MAX 20 MB/);
  assert.match(directory, /Upcoming IPOs/);
  assert.match(directory, /Private companies/);
});

test("shows an evidence-classified Apple supply-chain research document", async () => {
  const [document, panel, migration] = await Promise.all([
    source("app/company/aapl/supply-chain/page.tsx"),
    source("app/ResearchFoundationPanel.tsx"),
    source("drizzle/0005_emerging-companies-and-aapl-supply-chain.sql"),
  ]);

  assert.match(document, /Apple’s 2025 Form 10-K/);
  assert.match(document, /generally does <strong>not<\/strong> name the individual supplier/);
  assert.match(document, /Apple Supplier List/);
  assert.match(document, /What one graph relationship stores/);
  assert.match(document, /Still unresolved/);
  assert.match(panel, /Open Apple supply-chain document/);
  assert.match(migration, /Taiwan Semiconductor Manufacturing Company Limited/);
  assert.match(migration, /exact role in the cited list/);
});

test("opens homepage sample cards and changelog rows as company dossiers", async () => {
  const home = await source("app/page.tsx");

  assert.match(home, /const dossierHref = \(ticker: string\) => `\/company\/\$\{companySlug\(ticker\)\}`/);
  assert.match(home, /className="company-card-link" href=\{dossierHref\(company\.ticker\)\}/);
  assert.match(home, /href=\{dossierHref\(update\.ticker\)\} className="change-row"/);
  assert.doesNotMatch(home, /company\.ticker === "ONDS" \? "\/company\/onds" : "\/companies"/);
});

test("keeps NYSE and Nasdaq separate from the official FINRA OTC catalog", async () => {
  const [directory, api, schema, migration, updater, overlay, metadata, header, footer] = await Promise.all([
    source("app/CompanyUniverseDirectory.tsx"),
    source("app/api/universe/route.ts"),
    source("db/schema.ts"),
    source("drizzle/0006_official-exchange-universe.sql"),
    source("scripts/update-exchange-universe.mjs"),
    source("scripts/generate-company-index-overlay.ts"),
    source("app/data/exchangeUniverseMeta.generated.ts"),
    source("app/ui.tsx"),
    source("app/layout.tsx"),
  ]);

  assert.match(directory, /OTC does not mean “Pink Sheet” in every case/);
  assert.match(directory, /Catalog coverage is separate from dossier completion/);
  assert.match(directory, /SEC \+ Nasdaq Trader sources/);
  assert.match(api, /c\.listing_scope = \?/);
  assert.match(api, /LEFT JOIN company_dossiers/);
  assert.match(api, /LIMIT \? OFFSET \?/);
  assert.match(schema, /listingScope/);
  assert.match(schema, /securityType/);
  assert.match(schema, /universeSourceUrl/);
  assert.match(migration, /companies_listing_scope_ticker_idx/);
  assert.match(updater, /company_tickers_exchange\.json/);
  assert.match(updater, /otcSecurityMaster/);
  assert.match(updater, /nasdaqlisted\.txt/);
  assert.match(overlay, /memberships_json = excluded\.memberships_json/);
  assert.doesNotMatch(overlay, /exchange = excluded\.exchange/);
  assert.doesNotMatch(overlay, /name = excluded\.name/);
  assert.doesNotMatch(overlay, /company_dossiers/);
  assert.match(metadata, /listedSecurityCount = \d+/);
  assert.match(metadata, /otcSecurityCount = \d+/);
  assert.match(header, /href="\/otc"/);
  assert.match(footer, /OTC \/ Pink Market/);
});

test("keeps long starter-company names clear of account actions", async () => {
  const [starter, styles] = await Promise.all([
    source("app/company/[ticker]/page.tsx"),
    source("app/globals.css"),
  ]);

  assert.match(starter, /name: catalogCompany\?\.name \|\| universeCompany\.name/);
  assert.match(starter, /normalized\(firstWord\) === normalized\(ticker\)/);
  assert.match(styles, /@media\(max-width:1100px\)\{\.starter-company-hero>\.container\{grid-template-columns:1fr/);
  assert.match(styles, /\.starter-company-title h1\{max-width:24ch/);
  assert.match(styles, /\.starter-company-actions\{max-width:540px[^}]*flex-wrap:wrap/);
});

test("ranks featured homepage dossiers by verified community research demand", async () => {
  const [home, route, migration] = await Promise.all([
    source("app/page.tsx"),
    source("app/api/research-demand/route.ts"),
    source("supabase/migrations/20260801060000_company_research_demand.sql"),
  ]);

  for (const ticker of ["AMC", "NVDA", "AAPL", "AMZN", "TSLA", "PLTR", "RKLB", "SPCX", "BB", "BE", "BA", "CAT", "CRWV", "ORCL"]) assert.match(home, new RegExp(`ticker: "${ticker}"`));
  assert.match(home, /Hot companies, ranked by owners/);
  assert.match(home, /toggleDemand/);
  assert.match(home, /viewerVotes/);
  assert.match(home, /NEXT IN THE RESEARCH QUEUE/);
  assert.match(route, /company_research_demand/);
  assert.match(route, /requireSupabaseUser/);
  assert.match(migration, /create table if not exists public\.company_research_votes/);
  assert.match(migration, /count\(distinct s\.visitor_id\)/);
  assert.match(migration, /vote_count \* 10 \+ c\.page_views/);
  assert.match(migration, /auth\.uid\(\) = user_id/);
});

test("provides full primary-source dossiers for all homepage companies", async () => {
  const [dossiers, featuredPage, starterPage, ondas] = await Promise.all([
    source("app/data/featuredDossiers.ts"),
    source("app/FeaturedCompanyDossier.tsx"),
    source("app/company/[ticker]/page.tsx"),
    source("app/company/onds/page.tsx"),
  ]);
  for (const ticker of ["NVDA", "AAPL", "AMZN", "TSLA", "PLTR", "RKLB", "BB", "BE", "BA", "CAT", "CRWV", "ORCL"]) assert.match(dossiers, new RegExp(`\\n  ${ticker}: \\{`));
  assert.match(dossiers, /BlackBerry 2026 Form 10-K/);
  assert.match(dossiers, /Bloom Energy 2025 Form 10-K/);
  assert.match(dossiers, /Rocket Lab 2025 Form 10-K/);
  assert.match(dossiers, /Palantir 2025 Form 10-K/);
  assert.match(dossiers, /Tesla 2025 Form 10-K/);
  assert.match(featuredPage, /ResearchDemandButton/);
  assert.match(starterPage, /ResearchDemandButton/);
  assert.match(ondas, /FeaturedCompanyDossier/);
});

test("publishes complete primary-source owner dossiers for AMC and RCL", async () => {
  const [dossiers, featuredPage, generator] = await Promise.all([
    source("app/data/featuredDossiers.ts"),
    source("app/FeaturedCompanyDossier.tsx"),
    source("scripts/generate-normalized-dossier-publish.ts"),
  ]);

  for (const ticker of ["AMC", "RCL"]) {
    assert.match(dossiers, new RegExp(`\\n  ${ticker}: \\{`));
    assert.match(dossiers, new RegExp(`ticker: "${ticker}"[\\s\\S]{0,120}completeness: 100`));
  }
  assert.match(dossiers, /AMC Entertainment 2025 Form 10-K/);
  assert.match(dossiers, /AMC Second-Quarter 2026 Form 10-Q/);
  assert.match(dossiers, /2026 YTD share-price return/);
  assert.match(dossiers, /Cinemark Holdings/);
  assert.match(dossiers, /Regal Cineworld Group/);
  assert.match(dossiers, /IMAX Corporation/);
  assert.match(featuredPage, /Competitors &amp; comparables/);
  assert.match(featuredPage, /Performance—and what drove it/);
  assert.match(dossiers, /Royal Caribbean 2025 Form 10-K/);
  assert.match(dossiers, /Royal Caribbean Second-Quarter 2026 Results/);
  assert.match(featuredPage, /Primary-source editorial review/);
  assert.match(featuredPage, /item\.href\.includes\("sec\.gov"\)/);
  assert.match(generator, /financial_drivers_json/);
  assert.match(generator, /INSERT INTO dossier_claims/);
  assert.match(generator, /DELETE FROM dossier_sources WHERE ticker/);
});

test("publishes a complete filing-grounded CoreWeave ownership dossier", async () => {
  const [dossiers, featuredPage] = await Promise.all([
    source("app/data/featuredDossiers.ts"),
    source("app/FeaturedCompanyDossier.tsx"),
  ]);

  assert.match(dossiers, /ticker: "CRWV"[\s\S]{0,120}completeness: 100/);
  assert.match(dossiers, /CoreWeave First-Quarter 2026 Form 10-Q/);
  assert.match(dossiers, /\$99\.4B/);
  assert.match(dossiers, /65% top two/);
  assert.match(dossiers, /\$25\.15B debt/);
  assert.match(dossiers, /\$7\.70B Q1 capex/);
  assert.match(dossiers, /NVIDIA and CoreWeave expanded collaboration/);
  assert.match(dossiers, /Nebius Group/);
  assert.match(dossiers, /Amazon Web Services/);
  assert.match(dossiers, /Microsoft Azure/);
  assert.match(dossiers, /Lambda/);
  assert.match(dossiers, /Crusoe/);
  assert.match(dossiers, /Second-quarter results · August 11/);
  assert.match(featuredPage, /CoreWeave, Inc\./);
  assert.match(featuredPage, /View \{comparableSourceLabel\(item\.sourceUrl\)\} ↗/);
  assert.match(featuredPage, /Third-party financial metrics are shown only as dated, attributed reference snapshots/);
});

test("keeps dossier comparables readable across desktop and mobile widths", async () => {
  const styles = await source("app/globals.css");

  assert.match(styles, /grid-template-columns:minmax\(140px,\.8fr\) minmax\(0,1fr\) minmax\(0,1fr\) minmax\(0,1\.45fr\);min-width:0/);
  assert.match(styles, /@media\(max-width:900px\)[\s\S]*?\.comparables-table>a\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(styles, /@media\(max-width:620px\)\{\.comparables-table>a\{grid-template-columns:1fr\}/);
  assert.match(styles, /\.comparables-table>a>span\{min-width:0;[^}]*overflow-wrap:anywhere/);
});

test("publishes a complete filing-grounded Oracle ownership dossier", async () => {
  const [home, dossiers, featuredPage] = await Promise.all([
    source("app/page.tsx"),
    source("app/data/featuredDossiers.ts"),
    source("app/FeaturedCompanyDossier.tsx"),
  ]);

  assert.match(home, /ticker: "ORCL"/);
  assert.match(dossiers, /ticker: "ORCL"[\s\S]{0,120}completeness: 100/);
  assert.match(dossiers, /Oracle 2026 Form 10-K/);
  assert.match(dossiers, /\$638 billion/);
  assert.match(dossiers, /\$55\.66 billion/);
  assert.match(dossiers, /\$129\.54 billion/);
  assert.match(dossiers, /\$260 billion/);
  assert.match(dossiers, /Microsoft Azure/);
  assert.match(dossiers, /Amazon Web Services/);
  assert.match(dossiers, /SAP/);
  assert.match(dossiers, /Salesforce/);
  assert.match(dossiers, /Epic Systems/);
  assert.match(dossiers, /Customer status should not be confused with supplier status/);
  assert.match(featuredPage, /Oracle Corporation/);
});

test("publishes the founder mission with @Yourhost as host and letter author", async () => {
  const [home, letter, header, footer, founderMigration] = await Promise.all([
    source("app/page.tsx"),
    source("app/founders-letter/page.tsx"),
    source("app/ui.tsx"),
    source("app/layout.tsx"),
    source("supabase/migrations/20260801070000_founder_administrator.sql"),
  ]);

  assert.match(home, /THE FOUNDER’S MISSION/);
  assert.match(home, /Ownership should come with understanding/);
  assert.match(home, /Ownership Intelligence Network/);
  assert.match(home, /HOSTED &amp; MODERATED BY/);
  assert.match(home, /@Yourhost/);
  assert.doesNotMatch(home, /RemarkAI/);
  assert.match(letter, /We believe ownership should come with understanding/);
  assert.match(letter, /Written by @Yourhost · Founder, public host, and moderator/);
  assert.match(letter, /Together, they create a new form of Ownership Intelligence/);
  assert.match(founderMigration, /lower\(username\) in \('yourhost', 'founder'\)/);
  assert.match(founderMigration, /set role = 'admin'/);
  assert.match(founderMigration, /order by created_at asc/);
  assert.match(home, /href="\/company\/amc"/);
  assert.match(header, /<summary>Research<\/summary>/);
  assert.match(footer, /Founder’s Letter/);
  assert.match(footer, /Featured AMC dossier/);
});

test("separates company releases from external news on every dossier", async () => {
  const [panel, route, newsText, dossiers, featuredPage, starterPage, ondas, styles] = await Promise.all([
    source("app/CompanyNewsPanel.tsx"),
    source("app/api/company-news/route.ts"),
    source("app/news-text.ts"),
    source("app/data/featuredDossiers.ts"),
    source("app/FeaturedCompanyDossier.tsx"),
    source("app/company/[ticker]/page.tsx"),
    source("app/company/onds/page.tsx"),
    source("app/globals.css"),
  ]);

  assert.match(panel, /Official does not mean independently verified/);
  assert.match(panel, /Official company releases/);
  assert.match(panel, /SEARCH OFFICIAL RELEASES/);
  assert.match(panel, /Expand to Read Full Press Release/);
  assert.match(panel, /Show 10 more official releases/);
  assert.match(panel, /External coverage of/);
  assert.match(panel, /INDEPENDENT JOURNALISM/);
  assert.match(panel, /Corporate press-release wires are excluded/);
  assert.match(panel, /Bing News, Google News, TradingView, and GDELT/);
  assert.match(panel, /news-provider-filters/);
  assert.match(panel, /summaryFormat=2/);
  assert.match(route, /companyOfficialNews\(ticker, companyName, newsroomUrl, newsroomFeedUrl\)/);
  assert.match(route, /secOfficialNews\(cik\)/);
  assert.match(route, /officialSources: \[effectiveCompanyHealth, secOfficial\.health\]/);
  assert.match(route, /news\.microsoft\.com\/source\/feed/);
  assert.match(route, /about\.netflix\.com\/en\/feed\.xml/);
  assert.match(route, /www\.apple\.com\/newsroom\/rss-feed\.rss/);
  assert.match(route, /nvidianews\.nvidia\.com\/releases\.xml/);
  assert.match(route, /www\.bing\.com\/news\/search/);
  assert.match(route, /news\.google\.com\/rss\/search/);
  assert.match(route, /api\.gdeltproject\.org\/api\/v2\/doc\/doc/);
  assert.match(route, /mergePublicSources/);
  assert.match(route, /Promise\.allSettled\(publicSources/);
  assert.match(route, /replace\(\/\^http:/);
  assert.match(route, /parseNewsroomHtml/);
  assert.match(route, /parseCoreWeaveNewsroom/);
  assert.match(route, /parseDellAemNewsroom/);
  assert.match(route, /corporate\/newsroom\.model\.json/);
  assert.match(route, /data\.sec\.gov\/submissions/);
  assert.match(route, /stripNewsHtml/);
  assert.match(newsText, /export function stripNewsHtml/);
  assert.match(newsText, /style\|script\|noscript/);
  assert.match(newsText, /prnews_span/);
  assert.match(route, /data-content-type=\["'\]press-release/);
  assert.match(route, /const companyReleases = unique/);
  assert.match(route, /const secFilings = unique/);
  assert.match(route, /companyReleases,/);
  assert.match(route, /secFilings,/);
  assert.match(panel, /official-source-health/);
  assert.match(route, /stale-while-revalidate=900/);
  assert.match(dossiers, /www\.coreweave\.com\/newsroom/);
  assert.match(dossiers, /investor\.amctheatres\.com\/news-events\/press-releases/);
  assert.match(dossiers, /investor\.amctheatres\.com\/news-events\/press-releases\/rss/);
  assert.match(dossiers, /rclinvestor\.com\/press-releases/);
  assert.match(featuredPage, /href="#news"/);
  assert.match(starterPage, /CompanyNewsPanel/);
  assert.match(ondas, /FeaturedCompanyDossier/);
  assert.match(styles, /\.company-news-grid\{display:grid;grid-template-columns:minmax\(0,1\.35fr\)/);
  assert.match(styles, /\.official-news-list article/);
});

test("automatically imports, refreshes, and explains filing-grounded financial history", async () => {
  const [panel, researchApi, importer, scheduledRoute, worker, schema, migration, quarterlyMigration, runtimeSchema, amcSeed, publisher, styles, viteConfig] = await Promise.all([
    source("app/ResearchFoundationPanel.tsx"),
    source("app/api/research/route.ts"),
    source("app/data/secFactsRepository.ts"),
    source("app/api/internal/sec-facts-refresh/route.ts"),
    source("worker/index.ts"),
    source("db/schema.ts"),
    source("drizzle/0007_sec-fact-import-status.sql"),
    source("drizzle/0012_quarterly_dossier_updates.sql"),
    source("db/runtimeSchema.ts"),
    source("drizzle/0010_seed-amc-sec-facts.sql"),
    source("scripts/generate-normalized-dossier-publish.ts"),
    source("app/globals.css"),
    source("vite.config.ts"),
  ]);

  assert.match(panel, /Filed financial history/);
  assert.match(panel, /standalone quarter, a year-to-date period, a full year, or a period-end balance/);
  assert.match(panel, /filingPeriodLabel/);
  assert.match(panel, /No estimates were substituted/);
  assert.match(panel, /Open machine-readable source/);
  assert.match(researchApi, /factsImport/);
  assert.match(researchApi, /facts\.length === 0 && dossierState\?\.status === "published" && dossierState\.qualityTier !== "starting_point"/);
  assert.doesNotMatch(researchApi, /featuredDossiers\[ticker\]/);
  assert.match(researchApi, /Initial SEC facts import failed/);
  assert.match(importer, /data\.sec\.gov\/api\/xbrl\/companyfacts/);
  assert.match(importer, /filingFactImports/);
  assert.match(importer, /recordLatestQuarterlyUpdate/);
  assert.match(importer, /quarterlyDossierUpdates/);
  assert.match(importer, /ensureFeaturedDossierRegistration/);
  assert.match(importer, /Founding editorial research/);
  assert.match(scheduledRoute, /SCHEDULED_REFRESH_LIMIT = 12/);
  assert.match(scheduledRoute, /FROM company_dossiers d JOIN companies c/);
  assert.match(scheduledRoute, /COALESCE\(f\.last_attempted_at,''\) ASC/);
  assert.match(scheduledRoute, /COALESCE\(d\.quality_tier,'starting_point'\)<>'starting_point'/);
  assert.doesNotMatch(scheduledRoute, /Object\.values\(featuredDossiers\)/);
  assert.match(scheduledRoute, /ensureFeaturedDossierRegistration/);
  assert.match(scheduledRoute, /cloudflare:workers/);
  assert.match(scheduledRoute, /bindings\.NOTIFICATION_CRON_SECRET/);
  assert.match(scheduledRoute, /bindings\.NOTIFICATION_CRON_SECRET \|\| bindings\.SCHEDULED_TASK_SECRET/);
  assert.match(worker, /refreshScheduledSecFacts/);
  assert.match(worker, /if \(!isPacificDigestHour\(controller\.scheduledTime\)\) return/);
  assert.match(viteConfig, /0 0,6,12,18 \* \* \*/);
  assert.match(schema, /export const quarterlyDossierUpdates/);
  assert.match(quarterlyMigration, /quarterly_dossier_updates/);
  assert.match(quarterlyMigration, /facts_refreshed/);
  assert.match(researchApi, /quarterlyUpdates/);
  assert.match(researchApi, /Promise\.allSettled/);
  assert.match(researchApi, /continuing with core research sources/);
  assert.match(runtimeSchema, /CREATE TABLE IF NOT EXISTS quarterly_dossier_updates/);
  assert.match(panel, /QUARTERLY DOSSIER REFRESH/);
  assert.match(panel, /Filing and facts automatically added/);
  assert.match(worker, /learn-what-you-own\.julianspencer\.chatgpt\.site/);
  assert.match(worker, /www\.learnwhatyouown\.com/);
  assert.match(worker, /Response\.redirect\(canonicalUrl, 308\)/);
  assert.match(schema, /filingFactImports/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS `filing_fact_imports`/);
  assert.match(amcSeed, /VALUES \('AMC', 'revenue'/);
  assert.match(amcSeed, /CIK0001411579\.json', 240, 12/);
  assert.match(publisher, /generateSecFactSql/);
  assert.match(styles, /\.filing-history\{display:flex/);
});

test("separates publication from dossier quality and ranks index research from the live market feed", async () => {
  const [schema, migration, activation, universeRoute, directory, russellPage, russell3000Page, nasdaq100Page, navigation, sitemap, styles, starter, batches, rankingRoute, marketQuotes, researchRoute, secFacts, dossierFreshness, freshnessApi, freshnessAdmin, worker, sourceBackfill, sourceBackfillRoute, sourceBackfillAdmin, sourceBackfillMigration, automaticFreshnessMigration, dossierCompletion, completionAdminApi, completionInternalApi, completionAdmin, completionMigration, coverageMigration, newListingMigration] = await Promise.all([
    source("db/schema.ts"),
    source("drizzle/0030_dossier_quality_and_russell_rollout.sql"),
    source("drizzle/0032_activate_ranked_research_foundations.sql"),
    source("app/api/universe/route.ts"),
    source("app/CompanyUniverseDirectory.tsx"),
    source("app/research/russell-2000/page.tsx"),
    source("app/research/russell-3000/page.tsx"),
    source("app/research/nasdaq-100/page.tsx"),
    source("app/ui.tsx"),
    source("app/sitemaps/core.xml/route.ts"),
    source("app/globals.css"),
    source("app/company/[ticker]/page.tsx"),
    source("app/research/batches/page.tsx"),
    source("app/api/internal/rollout-market-cap-refresh/route.ts"),
    source("app/market-quotes.ts"),
    source("app/api/research/route.ts"),
    source("app/data/secFactsRepository.ts"),
    source("app/data/dossierFreshness.ts"),
    source("app/api/admin/freshness/route.ts"),
    source("app/admin/FreshnessQueue.tsx"),
    source("worker/index.ts"),
    source("app/data/dossierSourceBackfill.ts"),
    source("app/api/internal/dossier-source-backfill/route.ts"),
    source("app/admin/SourceBackfillQueue.tsx"),
    source("drizzle/0035_russell_sec_source_backfill.sql"),
    source("drizzle/0040_automatic_sec_filing_publication.sql"),
    source("app/data/dossierCompletion.ts"),
    source("app/api/admin/dossier-completion/route.ts"),
    source("app/api/internal/dossier-completion/route.ts"),
    source("app/admin/DossierCompletionQueue.tsx"),
    source("drizzle/0041_automatic_benchmark_completion.sql"),
    source("drizzle/0042_expand_source_backfill_coverage.sql"),
    source("drizzle/0043_complete_new_listing_source_foundations.sql"),
  ]);
  assert.match(schema, /qualityTier: text\("quality_tier"/);
  assert.match(migration, /benchmark_complete/);
  assert.match(migration, /russell-2000-market-cap-01/);
  assert.match(migration, /ROW_NUMBER\(\) OVER \(ORDER BY c\.market_cap DESC/);
  assert.match(activation, /status='in_progress'/);
  assert.doesNotMatch(activation, /INSERT INTO dossier_sources/);
  assert.match(rankingRoute, /INSERT INTO company_dossiers/);
  assert.match(rankingRoute, /ACTIVATION_LIMIT = 75/);
  assert.match(rankingRoute, /All active Russell 2000-tagged constituents/);
  assert.match(rankingRoute, /ROW_NUMBER\(\) OVER \(ORDER BY c\.market_cap IS NULL,c\.market_cap DESC/);
  assert.match(rankingRoute, /evidence_ingestion/);
  assert.match(rankingRoute, /evidence_ready/);
  assert.match(researchRoute, /importSecFilingFacts\(ticker\)/);
  assert.match(secFacts, /data\.sec\.gov\/api\/xbrl\/companyfacts/);
  assert.match(dossierFreshness, /INSERT INTO dossier_sources/);
  assert.match(universeRoute, /dossier_quality_tier/);
  assert.match(universeRoute, /dossier_source_count/);
  assert.match(universeRoute, /qualitySummary/);
  assert.match(universeRoute, /COUNT\(DISTINCT COALESCE\(NULLIF\(c\.cik,''\),c\.ticker\)\) AS company_count/);
  assert.match(universeRoute, /AS market_cap_count/);
  assert.match(directory, /Benchmark-complete dossier/);
  assert.match(directory, /Research foundation/);
  assert.match(directory, /href="\/research\/russell-2000"/);
  assert.match(directory, /href="\/research\/russell-3000"/);
  assert.match(directory, /href="\/research\/nasdaq-100"/);
  assert.match(directory, /href="\/research\/sp-500"/);
  assert.match(directory, /aria-label="Company research universes"/);
  assert.match(directory, /href="\/companies">All Companies/);
  assert.match(directory, /S&amp;P 500[\s\S]*Nasdaq-100[\s\S]*Russell 2000[\s\S]*Russell 3000[\s\S]*OTC \/ Pink/);
  assert.match(directory, /<option value="">All exchanges<\/option><option>NYSE<\/option><option>NASDAQ<\/option>/);
  assert.doesNotMatch(directory, /href="\/companies">NYSE &amp; Nasdaq/);
  assert.match(directory, /indexMembership === "Russell 2000"/);
  assert.match(directory, /indexMembership === "Russell 3000"/);
  assert.match(directory, /indexMembership === "Nasdaq-100 \(QQQ\)"/);
  assert.match(directory, /distinct SEC issuers/);
  assert.match(directory, /FTSE Russell definition/);
  assert.match(directory, /Official Nasdaq-100 index page/);
  assert.match(directory, /Nasdaq-100 methodology/);
  assert.match(directory, /indexFocused \? "market_cap" : "ticker"/);
  assert.match(directory, /indexFocused \? "desc" : "asc"/);
  assert.match(directory, /CompanyUniverseDirectoryClient key=\{`\$\{props\.market\}:\$\{props\.indexMembership/);
  assert.match(directory, /Skip to page/);
  assert.match(directory, /« First/);
  assert.match(directory, /Last »/);
  assert.match(directory, /new FormData\(event\.currentTarget\)\.get\("page"\)/);
  assert.match(directory, /formatMarketCap\(company\.market_cap\)/);
  assert.match(directory, /DOSSIER COMPLETION PROGRAM/);
  assert.match(russellPage, /indexMembership="Russell 2000"/);
  assert.match(russell3000Page, /indexMembership="Russell 3000"/);
  assert.match(nasdaq100Page, /indexMembership="Nasdaq-100 \(QQQ\)"/);
  assert.match(navigation, /href="\/research\/nasdaq-100">Nasdaq-100 dossiers/);
  assert.match(sitemap, /"\/research\/nasdaq-100"/);
  assert.match(sitemap, /"\/research\/russell-3000"/);
  assert.match(styles, /grid-template-columns:repeat\(4,1fr\)/);
  assert.doesNotMatch(directory, />Published dossier</);
  assert.match(starter, /LIVE RESEARCH FOUNDATION/);
  assert.match(starter, /rollout_priority_rank/);
  assert.match(batches, /members ranked by current market capitalization/);
  assert.match(rankingRoute, /fetchNasdaqMarketUniverse/);
  assert.match(rankingRoute, /reconcileDossierQuality/);
  assert.doesNotMatch(rankingRoute, /2026-08-05-complete-benchmark/);
  assert.match(rankingRoute, /peer_company\.market_cap>target_company\.market_cap/);
  assert.match(marketQuotes, /download=true/);
  assert.match(freshnessApi, /WHEN 'earnings_release' THEN 100/);
  assert.match(freshnessApi, /json_group_array\(json_object/);
  assert.match(freshnessApi, /WHERE e\.status='published'/);
  assert.match(freshnessApi, /Official SEC filing evidence publishes automatically/);
  assert.doesNotMatch(freshnessApi, /eventIds\?: number\[\]/);
  assert.match(freshnessAdmin, /full-universe dossier program/);
  assert.match(freshnessAdmin, /Automatic SEC filing updates/);
  assert.match(freshnessAdmin, /Automatically published/);
  assert.doesNotMatch(freshnessAdmin, /Publish package update/);
  assert.match(worker, /dossier-freshness\?limit=10/);
  assert.match(worker, /dossier-source-backfill\?limit=12/);
  assert.match(worker, /dossier-completion\?limit=10/);
  assert.match(worker, /controller\.cron === "2-59\/5 \* \* \* \*"/);
  assert.match(worker, /rollout-market-cap-refresh/);
  assert.doesNotMatch(worker, /Sites dossier freshness mirror returned/);
  assert.doesNotMatch(worker, /Sites market-cap ranking mirror returned/);
  assert.match(sourceBackfill, /memberships_json LIKE '%Russell 3000%'/);
  assert.match(sourceBackfill, /memberships_json LIKE '%Nasdaq-100%'/);
  assert.match(sourceBackfill, /registeredIssuerSources/);
  assert.match(sourceBackfill, /issuer_filing_source_registry/);
  assert.doesNotMatch(sourceBackfill, /pack\.length \? \[\] : await registeredIssuerSources/);
  assert.match(sourceBackfill, /COUNT\(\*\)[\s\S]*<\?/);
  assert.match(sourceBackfill, /ORDER BY c\.market_cap IS NULL,c\.market_cap DESC/);
  assert.match(sourceBackfill, /INSERT INTO company_dossiers\(ticker,status,quality_tier,updated_at\)/);
  assert.match(sourceBackfill, /status='queued',published_at=NULL/);
  assert.match(sourceBackfill, /SOURCE_FOUNDATION_MINIMUM/);
  assert.match(sourceBackfill, /NARRATIVE_PRIMARY_DOCUMENT_MINIMUM/);
  assert.match(sourceBackfill, /url LIKE 'https:\/\/www\.sec\.gov\/Archives\/%'/);
  assert.match(sourceBackfill, /registry\.url=ds\.url AND registry\.active=1/);
  assert.match(sourceBackfill, /registry\.updated_at>prior\.completed_at/);
  assert.match(sourceBackfill, /DOSSIER_INGESTION_QUEUE/);
  assert.match(sourceBackfill, /acquireSelectionLease/);
  assert.match(sourceBackfill, /sendBatch/);
  assert.doesNotMatch(sourceBackfill, /company_dossiers\(ticker,status,quality_tier,content_json/);
  assert.match(sourceBackfill, /INSERT OR IGNORE INTO dossier_sources/);
  assert.match(sourceBackfill, /'sec_filing'/);
  assert.match(sourceBackfill, /evidence_date,excerpt,verified_at,created_at/);
  assert.doesNotMatch(sourceBackfill, /filing_type,filed_at,accessed_at/);
  assert.match(dossierFreshness, /evidence_date,excerpt,verified_at,created_at/);
  assert.match(dossierFreshness, /'published','','system:sec-freshness'/);
  assert.match(dossierFreshness, /CASE WHEN f\.error_message IS NOT NULL THEN 0 ELSE 1 END/);
  assert.match(dossierFreshness, /reconcileLegacyFreshnessSchemaErrors/);
  assert.match(dossierFreshness, /dossier_sources has no column named filing_type/);
  assert.match(dossierFreshness, /COUNT\(DISTINCT ds\.url\)[\s\S]*>=5/);
  assert.doesNotMatch(dossierFreshness, /filing_type,filed_at,accessed_at/);
  assert.match(automaticFreshnessMigration, /WHERE status='editorial_review'/);
  assert.match(automaticFreshnessMigration, /system:sec-freshness-backfill/);
  assert.match(sourceBackfill, /importSecFilingFacts/);
  assert.match(sourceBackfill, /reconcileDossierQuality/);
  assert.match(sourceBackfill, /recoverStaleDossierSourceBackfills/);
  assert.match(sourceBackfill, /Lease expired before a complete source pack/);
  assert.match(sourceBackfill, /error_message NOT LIKE 'Lease expired%'/);
  assert.match(sourceBackfill, /ensureLegacyResearchCompany/);
  assert.match(sourceBackfill, /FOREIGN KEY constraint failed/);
  assert.match(sourceBackfillRoute, /NOTIFICATION_CRON_SECRET/);
  assert.match(sourceBackfillAdmin, /Each ticker is an independent Cloudflare Queue job/);
  assert.match(sourceBackfillAdmin, /Queued ticker jobs/);
  assert.match(sourceBackfillAdmin, /Unresolved ingestion errors/);
  assert.match(sourceBackfillAdmin, /Official source limitations/);
  assert.match(worker, /processDossierSourceBackfillMessage/);
  assert.match(worker, /message\.retry\(\{ delaySeconds \}\)/);
  assert.match(sourceBackfillAdmin, /Superseded diagnostic run · inactive/);
  assert.match(sourceBackfillAdmin, /is_superseded_diagnostic/);
  assert.match(sourceBackfillMigration, /dossier_source_backfill_batches/);
  assert.match(schema, /issuerFilingSourceRegistry/);
  assert.match(coverageMigration, /Bank OZK 2025 Form 10-K/);
  assert.match(coverageMigration, /Preferred Bank official company filings/);
  assert.match(coverageMigration, /official-regulator-foundation-20260808/);
  assert.match(newListingMigration, /Mobility Global SEC company filings/);
  assert.match(newListingMigration, /Midera Food Processing SEC company filings/);
  assert.match(newListingMigration, /new-listing-source-foundation-20260808/);
  assert.match(dossierCompletion, /system:evidence-benchmark/);
  assert.match(dossierCompletion, /processAutomaticBenchmarkBatch/);
  assert.match(dossierCompletion, /acquireCompletionLease/);
  assert.match(dossierCompletion, /automatic_validation_already_running/);
  assert.match(dossierCompletion, /missing\.length/);
  assert.match(dossierCompletion, /reconcileDossierQuality/);
  assert.match(dossierCompletion, /status='needs_revision'/);
  assert.match(completionAdminApi, /processAutomaticBenchmarkBatch/);
  assert.match(completionAdminApi, /status: 405/);
  assert.match(completionInternalApi, /NOTIFICATION_CRON_SECRET/);
  assert.match(completionInternalApi, /processAutomaticBenchmarkBatch/);
  assert.match(completionAdmin, /Automatic benchmark publication/);
  assert.match(completionAdmin, /Validate next 30 automatically/);
  assert.match(completionAdmin, /no duplicate batch was created/);
  assert.match(completionAdmin, /CURRENT PROCESSING BATCH/);
  assert.match(completionAdminApi, /CASE WHEN status<>'completed' THEN 0 ELSE 1 END/);
  assert.doesNotMatch(completionAdmin, /Approve benchmark normalization/);
  assert.doesNotMatch(completionAdmin, /Return for revision/);
  assert.match(completionMigration, /automatic_validation/);
  assert.match(completionMigration, /NOT EXISTS/);
  assert.match(batches, /Completed batch ticker ledger/);
  assert.match(batches, /Superseded diagnostic run · inactive/);
  assert.match(batches, /newer\.universe_name=b\.universe_name/);
});

test("keeps the Nasdaq-100 source snapshot aligned with the official component feed", async () => {
  const [components, reconciliation] = await Promise.all([
    source("app/data/nasdaq100.ts"),
    source("drizzle/0034_reconcile_nasdaq_100_membership.sql"),
  ]);
  assert.doesNotMatch(components, /"ticker": "EA"/);
  assert.match(reconciliation, /WHERE ticker = 'EA'/);
  assert.match(reconciliation, /memberships_json = '\["S&P 500","Russell 3000"\]'/);
});

test("authority parity ignores harmless nested object key ordering", async () => {
  const verifier = await source("scripts/verify-authority-parity.mjs");
  const deployer = await source("scripts/deploy-production.mjs");
  assert.match(verifier, /function canonicalize\(value\)/);
  assert.match(verifier, /Object\.entries\(value\)\.sort/);
  assert.match(verifier, /JSON\.stringify\(canonicalize\(stable\)\)/);
  assert.match(deployer, /attempt <= 6/);
  assert.match(deployer, /setTimeout\(resolve, 3_000\)/);
});

test("shows privacy-preserving watchlist follower totals for every company", async () => {
  const [followerApi, home, directory, featured, starter, followerCount, watchlistButton] = await Promise.all([
    source("app/api/company-followers/route.ts"),
    source("app/page.tsx"),
    source("app/CompanyUniverseDirectory.tsx"),
    source("app/FeaturedCompanyDossier.tsx"),
    source("app/company/[ticker]/page.tsx"),
    source("app/CompanyFollowerCount.tsx"),
    source("app/WatchlistButton.tsx"),
  ]);

  assert.match(followerApi, /from\("watchlist_items"\)/);
  assert.match(followerApi, /select\("ticker"\)/);
  assert.match(followerApi, /follower_count/);
  assert.doesNotMatch(followerApi, /select\("user_id/);
  assert.match(followerApi, /cache-control.*public, max-age=60/);
  assert.match(home, /followingLabel/);
  assert.match(directory, /RESEARCH \/ FOLLOWERS/);
  assert.match(directory, /company-followers/);
  assert.match(featured, /PEOPLE FOLLOWING/);
  assert.match(starter, /PEOPLE FOLLOWING/);
  assert.match(followerCount, /Watchlist count unavailable/);
  assert.match(watchlistButton, /company-following-change/);
});

test("awards moderator-approved value and highlights public contributors", async () => {
  const [rewards, contributionModeration, feedbackModeration, account, leaderboard, schema, migration] = await Promise.all([
    source("db/rewards.ts"),
    source("app/api/admin/contributions/route.ts"),
    source("app/api/admin/feedback/route.ts"),
    source("app/account/RewardsSummary.tsx"),
    source("app/contributors/ContributorsClient.tsx"),
    source("db/schema.ts"),
    source("drizzle/0016_member_rewards.sql"),
  ]);
  assert.match(rewards, /ON CONFLICT\(user_id,event_type,source_type,source_id\) DO NOTHING/);
  assert.match(contributionModeration, /payload\.status === "approved"/);
  assert.match(contributionModeration, /awardPoints/);
  assert.match(feedbackModeration, /feature_planned/);
  assert.match(feedbackModeration, /feature_completed/);
  assert.match(account, /currencyNotice/);
  assert.match(leaderboard, /approvedAwards/);
  assert.match(schema, /memberRewardLedger/);
  assert.match(migration, /member_reward_source_unique_idx/);
});

test("separates professional contributor interviews from company management interviews", async () => {
  const [page, professional, publicApi, adminApi, schema, migration] = await Promise.all([
    source("app/interviews/page.tsx"),
    source("app/interviews/ProfessionalInterviews.tsx"),
    source("app/api/professional-interviews/route.ts"),
    source("app/api/admin/professional-interviews/route.ts"),
    source("db/schema.ts"),
    source("drizzle/0017_professional_interviews.sql"),
  ]);
  assert.match(page, /Company &amp; management interviews/);
  assert.match(page, /Investor &amp; contributor interviews/);
  assert.match(professional, /youtube-nocookie\.com\/embed/);
  assert.match(professional, /youtu\.be/);
  assert.match(professional, /POSITION &amp; CONFLICT DISCLOSURE/);
  assert.match(publicApi, /WHERE status='approved'/);
  assert.match(publicApi, /requireSupabaseUser/);
  assert.match(adminApi, /approved_professional_interview/);
  assert.match(schema, /professionalInterviews/);
  assert.match(migration, /professional_interview_public_idx/);
});

test("links portfolio members to official brokerage login and account-opening destinations", async () => {
  const [page, brokerageLinks, directory, clickRoute, analyticsRoute, adminAnalytics, schema, runtimeSchema, migration, styles] = await Promise.all([
    source("app/portfolio/page.tsx"),
    source("app/portfolio/BrokerageLinks.tsx"),
    source("app/brokerageDirectory.ts"),
    source("app/api/brokerage-click/route.ts"),
    source("app/api/admin/brokerage-analytics/route.ts"),
    source("app/admin/BrokerageAnalytics.tsx"),
    source("db/schema.ts"),
    source("db/runtimeSchema.ts"),
    source("drizzle/0018_brokerage_referral_tracking.sql"),
    source("app/globals.css"),
  ]);
  assert.match(page, /BrokerageLinks/);
  for (const name of ["E\*TRADE", "Fidelity", "Charles Schwab", "Morgan Stanley", "J\.P\. Morgan", "Interactive Brokers", "Robinhood", "SoFi Invest"]) {
    assert.match(directory, new RegExp(name));
  }
  const expectedOrder = ["key: \"robinhood\"", "key: \"etrade\"", "key: \"sofi\"", "key: \"schwab\"", "key: \"fidelity\"", "key: \"interactive-brokers\"", "key: \"morgan-stanley\"", "key: \"jpmorgan\""];
  const orderPositions = expectedOrder.map((entry) => directory.indexOf(entry));
  assert.ok(orderPositions.every((position) => position >= 0));
  assert.deepEqual(orderPositions, [...orderPositions].sort((a, b) => a - b));
  assert.match(directory, /BROKERAGE_REFERRAL_ETRADE/);
  assert.match(directory, /BROKERAGE_REFERRAL_ROBINHOOD/);
  assert.match(directory, /BROKERAGE_REFERRAL_SOFI/);
  assert.match(directory, /destinationType: referralUrl \? "paid_referral"/);
  assert.match(brokerageLinks, /api\/brokerage-click\?broker=/);
  assert.match(brokerageLinks, /never asks for, receives, or stores your brokerage username/);
  assert.match(brokerageLinks, /Affiliate disclosure/);
  assert.match(brokerageLinks, /noopener noreferrer sponsored nofollow/);
  assert.match(clickRoute, /INSERT INTO brokerage_clicks/);
  assert.match(clickRoute, /crypto\.randomUUID/);
  assert.doesNotMatch(clickRoute, /user-agent|cf-connecting-ip|portfolio_positions/i);
  assert.match(clickRoute, /A reporting outage must never trap a member/);
  assert.match(analyticsRoute, /requireAdmin/);
  assert.match(analyticsRoute, /paidReferralClicks30d/);
  assert.match(adminAnalytics, /Actual conversions and compensation/);
  assert.match(schema, /export const brokerageClicks/);
  assert.match(runtimeSchema, /ensureBrokerageClickSchema/);
  assert.match(migration, /PRAGMA optimize/);
  assert.match(styles, /\.brokerage-grid\{display:grid;grid-template-columns:repeat\(3/);
});

test("organizes company conversations without scraping Stocktwits messages", async () => {
  const [hub, conversations, featured, starter, navigation, styles] = await Promise.all([
    source("app/conversations/page.tsx"),
    source("app/CompanyConversations.tsx"),
    source("app/FeaturedCompanyDossier.tsx"),
    source("app/company/[ticker]/page.tsx"),
    source("app/ui.tsx"),
    source("app/globals.css"),
  ]);
  assert.match(hub, /Conversations with/);
  assert.match(hub, /CompanyConversations ticker=\{ticker\}/);
  assert.match(conversations, /LearnWhatYouOwn community/);
  assert.match(conversations, /Stocktwits market pulse/);
  assert.match(conversations, /widgets-api\.stocktwits-cdn\.com\/loader\.js/);
  assert.match(conversations, /chunks-prd\.stocktwits-cdn\.com/);
  assert.match(conversations, /tab !== "stocktwits"/);
  assert.match(conversations, /https:\/\/stocktwits\.com\/symbol\//);
  assert.match(conversations, /has not yet released its per-symbol embed/);
  assert.doesNotMatch(conversations, /api\.stocktwits\.com|fetch\([^)]*stocktwits/i);
  assert.match(featured, /href="#conversations"/);
  assert.match(featured, /<CompanyConversations ticker=\{company\.ticker\}/);
  assert.match(starter, /<CompanyConversations ticker=\{company\.ticker\}/);
  assert.match(navigation, /href="\/conversations"/);
  assert.match(styles, /\.stocktwits-widget-shell/);
  assert.match(styles, /@media\(max-width:760px\).*\.conversation-heading/s);
});

test("publishes a responsive cross-company SEC insider activity research screen", async () => {
  const [page, client, publicApi, refreshApi, repository, worker, schema, runtimeSchema, migration, navigation, layout, styles] = await Promise.all([
    source("app/insider-activity/page.tsx"),
    source("app/insider-activity/InsiderActivityScreen.tsx"),
    source("app/api/insider-activity/route.ts"),
    source("app/api/internal/insider-activity-refresh/route.ts"),
    source("app/data/secInsiderActivityRepository.ts"),
    source("worker/index.ts"),
    source("db/schema.ts"),
    source("db/runtimeSchema.ts"),
    source("drizzle/0020_insider_activity_ledger.sql"),
    source("app/ui.tsx"),
    source("app/layout.tsx"),
    source("app/globals.css"),
  ]);
  assert.match(page, /SEC OWNERSHIP INTELLIGENCE/);
  assert.match(client, /Top insider purchases/);
  assert.match(client, /Top insider sales/);
  assert.match(client, /Trailing 30 days/);
  assert.match(client, /Trailing 90 days/);
  assert.match(client, /Trailing 365 days/);
  assert.match(client, /Grants, gifts, option exercises/);
  assert.match(publicApi, /getSecInsiderActivity/);
  assert.doesNotMatch(publicApi, /CANONICAL_IMPORTER_ORIGIN/);
  assert.doesNotMatch(client, /source=canonical-worker/);
  assert.match(client, /await response\.text\(\)/);
  assert.match(client, /JSON\.parse\(raw\)/);
  assert.match(client, /temporarily unavailable \(HTTP/);
  assert.match(refreshApi, /refreshSecInsiderActivityBatch/);
  assert.match(repository, /master\.\$\{dateValue\.replaceAll/);
  assert.match(repository, /\^\(3\|3\\\/A\|4\|4\\\/A\|5\|5\\\/A\)\$/);
  assert.match(repository, /transaction\.direction === "purchase"/);
  assert.match(repository, /transaction\.direction === "sale"/);
  assert.match(worker, /refreshScheduledInsiderActivity/);
  assert.match(schema, /secInsiderTransactions/);
  assert.match(runtimeSchema, /ensureInsiderActivitySchema/);
  assert.match(migration, /sec_insider_direction_date_idx/);
  assert.match(navigation, /href="\/insider-activity"/);
  assert.match(layout, /Insider buys &amp; sells/);
  assert.match(styles, /\.insider-ranking-row/);
  assert.match(styles, /@media\(max-width:720px\).*\.insider-ranking-row\{display:grid;grid-template-columns:1fr 1fr/s);
});

test("keeps the complete masthead inside the viewport at every width", async () => {
  const [navigation, styles] = await Promise.all([
    source("app/ui.tsx"),
    source("app/globals.css"),
  ]);
  assert.match(navigation, /aria-controls="primary-navigation"/);
  assert.match(navigation, /aria-expanded=\{open\}/);
  assert.match(navigation, /href="\/contribute">Contribute Research<\/Link>/);
  assert.match(navigation, /href="\/emerging-companies">Private Companies &amp; YC<\/Link>/);
  assert.match(styles, /\.site-header \.nav-inner>nav\{display:none\}/);
  assert.match(styles, /\.site-header \.menu-button\{display:grid/);
  assert.match(styles, /\.site-header \.nav-inner>nav\.open\{display:flex;position:absolute/);
  assert.match(styles, /overflow-y:auto;overflow-x:hidden/);
  assert.match(styles, /\.workspace-menu\.research-menu,\.site-header \.nav-inner>nav\.open \.workspace-menu\.community-menu/);
});

test("adds sourced company contacts and management biographies to every dossier", async () => {
  const [panel, route, refresh, worker, featured, starter, migration, schema, styles] = await Promise.all([
    source("app/CompanyProfilePanel.tsx"),
    source("app/api/company-profile/route.ts"),
    source("app/data/companyProfileRefresh.ts"),
    source("worker/index.ts"),
    source("app/FeaturedCompanyDossier.tsx"),
    source("app/company/[ticker]/page.tsx"),
    source("drizzle/0045_company_contacts_and_management.sql"),
    source("db/schema.ts"),
    source("app/globals.css"),
  ]);
  assert.match(panel, /COMPANY CONTACT &amp; MANAGEMENT/);
  assert.match(panel, /Official investor-relations site/);
  assert.match(panel, /Filed roles and biographies/);
  assert.match(panel, /exact source validation/);
  assert.match(route, /company_contact_profiles/);
  assert.match(route, /company_management_people/);
  assert.match(refresh, /data\.sec\.gov\/submissions\/CIK/);
  assert.match(refresh, /investorWebsite/);
  assert.match(refresh, /mailto:/);
  assert.match(refresh, /citationExcerptResolves/);
  assert.match(refresh, /filedExcerptForName/);
  assert.match(refresh, /proxy_statement/);
  assert.match(refresh, /annual_report/);
  assert.match(refresh, /registrationManagementFiling/);
  assert.match(refresh, /S-1\|F-1\|S-4\|F-4\|10-12B/);
  assert.match(refresh, /company_profile_refresh_already_running/);
  assert.match(refresh, /started_at<datetime\('now','-2 minutes'\)/);
  assert.match(refresh, /status='error' AND j\.started_at/);
  assert.match(refresh, /Unterminated string in JSON/);
  assert.match(refresh, /max_tokens: retry \? 1_100 : 1_500/);
  assert.match(refresh, /validatePeople\(await request\(true\), text\)/);
  assert.match(worker, /refreshScheduledCompanyProfiles/);
  assert.match(worker, /company-profile-refresh/);
  assert.match(worker, /controller\.cron === "4-59\/5 \* \* \* \*"/);
  assert.match(featured, /CompanyProfilePanel/);
  assert.match(starter, /CompanyProfilePanel/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS company_contact_profiles/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS company_management_people/);
  assert.match(schema, /companyContactProfiles/);
  assert.match(schema, /companyManagementPeople/);
  assert.match(styles, /\.company-contact-grid/);
  assert.match(styles, /@media\(max-width:800px\)/);
});

test("accepts approved regulator sources without inventing SEC archive documents", async () => {
  const [enrichment,completion] = await Promise.all([
    source("app/data/dossierNarrativeEnrichment.ts"),
    source("app/data/dossierCompletion.ts"),
  ]);
  assert.match(enrichment, /issuer_filing_source_registry/);
  assert.match(enrichment, /registry\.url=source\.url AND registry\.active=1/);
  assert.match(enrichment, /approved primary regulator or issuer documents/);
  assert.match(enrichment, /insufficientCompetitorEvidence/);
  assert.match(enrichment, /ai\.toMarkdown/);
  assert.match(enrichment, /signature === "%PDF-"/);
  assert.match(enrichment, /output: \{ format: "text" \}/);
  assert.match(enrichment, /source_urls_json,attempt_count/);
  assert.match(enrichment, /PIPELINE_MODEL, "\[\]", target\.ticker/);
  assert.match(enrichment, /UPDATE dossier_narrative_enrichment_jobs SET source_urls_json=/);
  assert.match(enrichment, /company_description/);
  assert.match(enrichment, /section\.replaceAll\("_"," "\)/);
  assert.match(completion, /quality_tier IN \('machine_enriched','editorial_review'\)/);
});

test("replaces blocked bank IR pages with exact FDIC filing PDFs", async () => {
  const migration = await source("drizzle/0048_replace_blocked_bank_ir_with_fdic_filings.sql");
  assert.match(migration, /securitiesfilings\.fdicconnect\.fdic\.gov\/api\/instflng\/11868\/attachment\/1/);
  assert.match(migration, /securitiesfilings\.fdicconnect\.fdic\.gov\/api\/instflng\/11992\/attachment\/1/);
  assert.match(migration, /SET active=0/);
  assert.match(migration, /status='source_foundation_complete'/);
  assert.match(migration, /not_applicable_fdic_filer/);
});

test("publishes verified IR contacts and discovers official contact pages", async () => {
  const [refresh, migration] = await Promise.all([
    source("app/data/companyProfileRefresh.ts"),
    source("drizzle/0046_verified_ir_contacts.sql"),
  ]);
  assert.match(refresh, /normalizedIrHome/);
  assert.match(refresh, /irContactLinks/);
  assert.match(refresh, /investor-contacts/);
  for (const ticker of ["AMC","AMD","PLTR","TSLA"]) assert.match(migration,new RegExp(`'${ticker}'`));
  for (const email of ["InvestorRelations@amctheatres.com","Investor.Relations@amd.com","investors@palantir.com","ir@tesla.com"]) {
    assert.match(migration,new RegExp(email.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),"i"));
  }
});

test("publishes standardized dossier coverage, freshness, definitions, and methodology", async () => {
  const [status, methodology, featured, starter, research, route, navigation, sitemap, styles] = await Promise.all([
    source("app/DossierResearchStatus.tsx"),
    source("app/methodology/page.tsx"),
    source("app/FeaturedCompanyDossier.tsx"),
    source("app/company/[ticker]/page.tsx"),
    source("app/ResearchFoundationPanel.tsx"),
    source("app/api/research/route.ts"),
    source("app/ui.tsx"),
    source("app/sitemaps/core.xml/route.ts"),
    source("app/globals.css"),
  ]);
  assert.match(status, /RESEARCH COVERAGE &amp; FRESHNESS/);
  assert.match(status, /Know what is complete before relying on it/);
  assert.match(status, /LATEST AUTOMATIC CHANGE/);
  assert.match(status, /sourceCount/);
  assert.match(methodology, /SOURCE HIERARCHY/);
  assert.match(methodology, /Enterprise value/);
  assert.match(methodology, /Quarterly comparisons/);
  assert.match(featured, /DossierResearchStatus/);
  assert.match(starter, /DossierResearchStatus/);
  assert.match(research, /fact\.taxonomy/);
  assert.match(research, /fact\.accessionNumber/);
  assert.match(route, /taxonomy: fact\.taxonomy/);
  assert.match(route, /accessionNumber: fact\.accessionNumber/);
  assert.match(route, /from\(dossierSources\)/);
  assert.match(navigation, /Data &amp; coverage methodology/);
  assert.match(sitemap, /\/methodology/);
  assert.match(styles, /\.research-coverage-grid/);
  assert.match(styles, /\.fact-definition/);
});
