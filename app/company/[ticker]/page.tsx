import Link from "next/link";
import type { Metadata } from "next";
import { cache } from "react";
import { Header } from "../../ui";
import { SecFilingsPanel } from "../../SecFilingsPanel";
import { MarketDataPanel } from "../../MarketDataPanel";
import { WatchlistButton } from "../../WatchlistButton";
import { companySlug, researchUniverse, tickerFromSlug, type ResearchCompany } from "../../data/universe";
import { featuredDossiers } from "../../data/featuredDossiers";
import { FeaturedCompanyDossier } from "../../FeaturedCompanyDossier";
import { EarningsCallsPanel } from "../../EarningsCallsPanel";
import { CompanyConversations } from "../../CompanyConversations";
import { ResearchFoundationPanel } from "../../ResearchFoundationPanel";
import { SaveToNotebookButton } from "../../SaveToNotebookButton";
import { ResearchDemandButton } from "../../ResearchDemandButton";
import { CompanyNewsPanel } from "../../CompanyNewsPanel";
import { findCatalogCompany } from "../../../db/companyCatalog";
import { ExternalIntelligencePanel } from "../../ExternalIntelligencePanel";
import { CompanyFollowerCount } from "../../CompanyFollowerCount";
import { StockOwnershipPanel } from "../../StockOwnershipPanel";
import { AccessComparison } from "../../AccessComparison";
import { HistoricalValuationPanel } from "../../HistoricalValuationPanel";
import { CompanyMarketSnapshot } from "../../CompanyMarketSnapshot";
import { PublicFactsPanel } from "../../PublicFactsPanel";
import { CompanyLogo } from "../../CompanyLogo";
import { findPublishedDossier, isIndexablePublishedDossier } from "../../../db/publishedDossier";

// Company dossiers evolve continuously. Never serve an earlier generated dossier
// after editorial content for the same ticker has been promoted to flagship depth.
export const dynamic = "force-dynamic";

const publicOrigin = "https://learnwhatyouown.com";
const loadCatalogCompany = cache(findCatalogCompany);
const loadPublishedDossier = cache(findPublishedDossier);
const loadIndexEligibility = cache(isIndexablePublishedDossier);

function displayName(name: string, ticker: string) {
  if (ticker.toUpperCase() === "SPCX") return "SpaceX (Space Exploration Technologies Corp.)";
  if (ticker.toUpperCase() === "TSLA") return "Tesla, Inc.";
  const formatted = name.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace("3m", "3M").replace("At&t", "AT&T").replace("Cvs", "CVS")
    .replace("Ibm", "IBM").replace("Hp Inc", "HP Inc");
  const firstWord = formatted.split(/\s/, 1)[0];
  const normalized = (value: string) => value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return normalized(firstWord) === normalized(ticker) ? `${ticker}${formatted.slice(firstWord.length)}` : formatted;
}

export async function generateMetadata({ params }: { params: Promise<{ ticker: string }> }): Promise<Metadata> {
  const { ticker: slug } = await params;
  const ticker = tickerFromSlug(slug);
  const universeCompany = researchUniverse.find((item) => item.ticker === ticker);
  const catalogCompany = await loadCatalogCompany(ticker);
  const name = displayName(catalogCompany?.name || universeCompany?.name || `${ticker} company`, ticker);
  const storedDossier = await loadPublishedDossier(ticker);
  const indexable = Boolean(storedDossier) || await loadIndexEligibility(ticker);
  const fallbackDossier = featuredDossiers[ticker];
  const description = storedDossier?.description || fallbackDossier?.description || `Research ${name} (${ticker}), including SEC filings, ownership, valuation, earnings, risks, catalysts, and source-linked evidence.`;
  const canonical = `${publicOrigin}/company/${companySlug(ticker)}`;
  const title = `${name} (${ticker}) Stock Research, SEC Filings & Valuation | Learn What You Own`;

  return {
    title,
    description,
    alternates: { canonical },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

function CompanyStructuredData({ company, description, benchmarkComplete, updatedAt }: {
  company: ResearchCompany;
  description: string;
  benchmarkComplete: boolean;
  updatedAt?: string | null;
}) {
  const name = displayName(company.name, company.ticker);
  const canonical = `${publicOrigin}/company/${companySlug(company.ticker)}`;
  const pageNode = {
    "@type": benchmarkComplete ? "Article" : "WebPage",
    "@id": `${canonical}#dossier`,
    url: canonical,
    name: `${name} (${company.ticker}) ownership dossier`,
    headline: benchmarkComplete ? `${name} (${company.ticker}) ownership dossier` : undefined,
    description,
    dateModified: updatedAt || undefined,
    inLanguage: "en-US",
    author: benchmarkComplete ? { "@type": "Organization", name: "Learn What You Own", url: publicOrigin } : undefined,
    publisher: benchmarkComplete ? { "@type": "Organization", name: "Learn What You Own", url: publicOrigin } : undefined,
    about: {
      "@type": "Corporation",
      name,
      tickerSymbol: company.ticker,
    },
    isPartOf: { "@type": "WebSite", name: "Learn What You Own", url: `${publicOrigin}/` },
  };
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      pageNode,
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${publicOrigin}/` },
          { "@type": "ListItem", position: 2, name: "Companies", item: `${publicOrigin}/companies` },
          { "@type": "ListItem", position: 3, name: `${name} (${company.ticker})`, item: canonical },
        ],
      },
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replaceAll("<", "\\u003c") }} />;
}

export function generateStaticParams() {
  return researchUniverse.map((company) => ({ ticker: companySlug(company.ticker) }));
}

export default async function CompanyStarterPage({
  params,
  searchParams,
}: {
  params: Promise<{ ticker: string }>;
  searchParams: Promise<{ name?: string | string[] }>;
}) {
  const { ticker: slug } = await params;
  const ticker = tickerFromSlug(slug);
  const suppliedName = (await searchParams).name;
  const earningsName = Array.isArray(suppliedName) ? suppliedName[0] : suppliedName;
  const universeCompany = researchUniverse.find((item) => item.ticker === ticker);
  const catalogCompany = await loadCatalogCompany(ticker);
  const company: ResearchCompany = universeCompany ? {
    ...universeCompany,
    name: catalogCompany?.name || universeCompany.name,
    exchange: catalogCompany?.exchange || universeCompany.exchange,
    cik: catalogCompany?.cik,
    listingScope: catalogCompany?.listing_scope,
    securityType: catalogCompany?.security_type,
    securityDescription: catalogCompany?.security_description,
  } : (catalogCompany ? {
    ticker: catalogCompany.ticker,
    name: catalogCompany.name,
    sector: catalogCompany.sector,
    exchange: catalogCompany.exchange,
    marketCap: catalogCompany.market_cap,
    memberships: JSON.parse(catalogCompany.memberships_json) as ResearchCompany["memberships"],
    indexWeights: JSON.parse(catalogCompany.index_weights_json) as ResearchCompany["indexWeights"],
    cik: catalogCompany.cik,
    listingScope: catalogCompany.listing_scope,
    securityType: catalogCompany.security_type,
    securityDescription: catalogCompany.security_description,
  } : {
    ticker,
    name: earningsName?.trim().slice(0, 160) || `${ticker} company`,
    sector: "Classification pending",
    exchange: "U.S. listed",
    marketCap: null,
    memberships: ["Extended Coverage"],
    indexWeights: {},
  });
  const storedDossier = await loadPublishedDossier(company.ticker);
  const featuredDossier = storedDossier ?? featuredDossiers[company.ticker];
  if (featuredDossier) return <>
    <CompanyStructuredData company={company} description={featuredDossier.description} benchmarkComplete={Boolean(storedDossier)} updatedAt={catalogCompany?.dossier_updated_at} />
    <FeaturedCompanyDossier company={company} dossier={featuredDossier} />
  </>;
  const qualityTier = catalogCompany?.dossier_quality_tier ?? "starting_point";
  const hasResearchFoundation = catalogCompany?.dossier_status === "published" && qualityTier !== "starting_point";
  const qualityLabel = qualityTier === "benchmark_complete" ? "Benchmark-complete dossier"
    : qualityTier === "editorial_review" ? "Editorial review"
      : qualityTier === "machine_enriched" ? "Research foundation"
        : "Starting page";
  const rolloutLabel = catalogCompany?.rollout_priority_rank && catalogCompany.rollout_batch_name
    ? `#${catalogCompany.rollout_priority_rank} by descending market capitalization in the ${catalogCompany.rollout_batch_name} research batch`
    : null;

  return <><CompanyStructuredData company={company} description={`Research ${displayName(company.name, company.ticker)} (${company.ticker}), including SEC filings, ownership, valuation, earnings, risks, catalysts, and source-linked evidence.`} benchmarkComplete={false} updatedAt={catalogCompany?.dossier_updated_at} /><main><Header />
    <div className="container breadcrumbs"><Link href="/">Home</Link><span>/</span><Link href={company.exchange === "OTC" ? "/otc" : "/companies"}>{company.exchange === "OTC" ? "OTC directory" : "Companies"}</Link><span>/</span><strong>{company.ticker}</strong></div>
    <section className="starter-company-hero"><div className="container"><div className="starter-company-title"><CompanyLogo ticker={company.ticker} companyName={displayName(company.name, company.ticker)} size="hero" eager /><div><small>{company.exchange} · {company.ticker}</small><h1>{displayName(company.name, company.ticker)}</h1><p>{company.sector}</p><div className="starter-memberships">{company.memberships.map((index) => <em className={`membership-badge ${index === "S&P 500" ? "sp-badge" : index === "Russell 2000" ? "russell-badge" : index === "Russell 3000" ? "r3000-badge" : index === "Extended Coverage" ? "coverage-badge" : "qqq-badge"}`} key={index}>{index === "Extended Coverage" ? index : `${index} member`}</em>)}</div></div></div><div className="starter-company-actions"><WatchlistButton ticker={company.ticker}/><ResearchDemandButton ticker={company.ticker}/><SaveToNotebookButton ticker={company.ticker} companyName={displayName(company.name, company.ticker)} title={`${company.ticker} research starting point`} body={`Private research workspace for ${displayName(company.name, company.ticker)}.`}/><Link href={`/workspace?ticker=${encodeURIComponent(company.ticker)}`}>Private analyst workspace</Link><Link href={`/contribute?ticker=${encodeURIComponent(company.ticker)}`}>Contribute expertise →</Link></div></div></section>
    {company.exchange !== "OTC" && <CompanyMarketSnapshot ticker={company.ticker} />}
    <section className="container starter-dossier">
      {company.exchange === "OTC" && <div className="otc-company-notice"><strong>OTC security · {company.securityType ?? "issue type not classified"}</strong><p>This security is not listed on the NYSE or Nasdaq. OTC liquidity, disclosure, reporting status, and market tier require separate verification before research is published.</p></div>}
      <div className={`coverage-banner ${hasResearchFoundation ? "research-foundation-banner" : ""}`}><span>{hasResearchFoundation ? "LIVE RESEARCH FOUNDATION" : "FOUNDING COVERAGE"}</span><h2>{hasResearchFoundation ? "Primary-source research is active." : "This owner’s manual is ready to be built."}</h2><p>{hasResearchFoundation ? "Current market data, SEC filing facts, filing alerts, ownership records, official releases, and external coverage are pulled from their live sources. Editorial bull and bear analysis remains clearly labeled until it passes human evidence review." : "The company and ticker are now part of the research universe. Verified claims, sources, business-model analysis, theses, filings, and expert contributions will be added through the editorial workflow."}</p>{rolloutLabel && <strong className="rollout-rank-label">{rolloutLabel}</strong>}</div>
      <div className="starter-metrics"><div><small>INDEX MEMBERSHIP</small><strong>{company.memberships.join(" · ") || "No tracked membership"}</strong></div><div><small>{company.exchange === "OTC" ? "ISSUE TYPE" : "SECTOR"}</small><strong>{company.exchange === "OTC" ? company.securityType : company.sector}</strong></div><div><small>MARKET</small><strong>{company.exchange}</strong></div><div><small>PEOPLE FOLLOWING</small><CompanyFollowerCount ticker={company.ticker} /></div><div><small>DOSSIER STATUS</small><strong className={hasResearchFoundation ? "green-text" : "amber-text"}>{qualityLabel}</strong></div></div>
      {company.exchange !== "OTC" && <MarketDataPanel ticker={company.ticker} exchange={company.exchange} />}
      {company.exchange !== "OTC" && <PublicFactsPanel ticker={company.ticker} />}
      {company.exchange !== "OTC" && <HistoricalValuationPanel ticker={company.ticker} />}
      {company.exchange !== "OTC" && <StockOwnershipPanel ticker={company.ticker} />}
      <ResearchFoundationPanel ticker={company.ticker} companyName={displayName(company.name, company.ticker)} editorialUpdatedAt={catalogCompany?.dossier_updated_at ?? undefined} />
      <ExternalIntelligencePanel ticker={company.ticker} companyName={displayName(company.name, company.ticker)} sector={company.sector} />
      <EarningsCallsPanel ticker={company.ticker} />
      <CompanyNewsPanel ticker={company.ticker} companyName={displayName(company.name, company.ticker)} />
      <div className="starter-sections">
        {["Owner’s summary","Business model","Why own it","Why not own it","Financial dashboard","What changed","Earnings & filings","Competitive landscape"].map((section, index) => <div key={section}><span>{String(index + 1).padStart(2,"0")}</span><strong>{section}</strong><em>{hasResearchFoundation ? (["Financial dashboard","What changed","Earnings & filings"].includes(section) ? "Live primary-source data" : "Editorial research in progress") : section === "Earnings & filings" ? "SEC links available" : "Awaiting research"}</em></div>)}
      </div>
      <SecFilingsPanel ticker={company.ticker} />
      <CompanyConversations ticker={company.ticker} />
      <div className="coverage-actions"><div><span className="kicker">HELP BUILD THIS DOSSIER</span><h2>Know this business deeply?</h2><p>Submit a fact, source, correction, or question for management. Every contribution is reviewed before publication.</p></div><Link className="button dark-button" href={`/contribute?ticker=${encodeURIComponent(company.ticker)}`}>Start a contribution →</Link></div>
    </section>
    <AccessComparison />
  </main></>;
}
