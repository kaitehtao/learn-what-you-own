import Link from "next/link";
import { Header } from "../../ui";
import { SecFilingsPanel } from "../../SecFilingsPanel";
import { MarketDataPanel } from "../../MarketDataPanel";
import { WatchlistButton } from "../../WatchlistButton";
import { companySlug, researchUniverse, tickerFromSlug, type ResearchCompany } from "../../data/universe";
import { featuredDossiers } from "../../data/featuredDossiers";
import { FeaturedCompanyDossier } from "../../FeaturedCompanyDossier";
import { EarningsCallsPanel } from "../../EarningsCallsPanel";
import { CommunityInsights } from "../../CommunityInsights";
import { ResearchFoundationPanel } from "../../ResearchFoundationPanel";
import { SaveToNotebookButton } from "../../SaveToNotebookButton";
import { ResearchDemandButton } from "../../ResearchDemandButton";
import { findCatalogCompany } from "../../../db/companyCatalog";

function displayName(name: string) {
  return name.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace("3m", "3M").replace("At&t", "AT&T").replace("Cvs", "CVS")
    .replace("Ibm", "IBM").replace("Hp Inc", "HP Inc");
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
  const catalogCompany = universeCompany ? null : await findCatalogCompany(ticker);
  const company: ResearchCompany = universeCompany ?? (catalogCompany ? {
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
  const featuredDossier = featuredDossiers[company.ticker];
  if (featuredDossier) return <FeaturedCompanyDossier company={company} dossier={featuredDossier} />;

  return <main><Header />
    <div className="container breadcrumbs"><Link href="/">Home</Link><span>/</span><Link href={company.exchange === "OTC" ? "/otc" : "/companies"}>{company.exchange === "OTC" ? "OTC directory" : "Companies"}</Link><span>/</span><strong>{company.ticker}</strong></div>
    <section className="starter-company-hero"><div className="container"><div className="starter-company-title"><span>{company.ticker}</span><div><small>{company.exchange} · {company.ticker}</small><h1>{displayName(company.name)}</h1><p>{company.sector}</p><div className="starter-memberships">{company.memberships.map((index) => <em className={`membership-badge ${index === "S&P 500" ? "sp-badge" : index === "Russell 2000" ? "russell-badge" : index === "Russell 3000" ? "r3000-badge" : index === "Extended Coverage" ? "coverage-badge" : "qqq-badge"}`} key={index}>{index === "Extended Coverage" ? index : `${index} member`}</em>)}</div></div></div><div className="starter-company-actions"><WatchlistButton ticker={company.ticker}/><ResearchDemandButton ticker={company.ticker}/><SaveToNotebookButton ticker={company.ticker} companyName={displayName(company.name)} title={`${company.ticker} research starting point`} body={`Private research workspace for ${displayName(company.name)}.`}/><Link href={`/contribute?ticker=${encodeURIComponent(company.ticker)}`}>Contribute expertise →</Link></div></div></section>
    <section className="container starter-dossier">
      {company.exchange === "OTC" && <div className="otc-company-notice"><strong>OTC security · {company.securityType ?? "issue type not classified"}</strong><p>This security is not listed on the NYSE or Nasdaq. OTC liquidity, disclosure, reporting status, and market tier require separate verification before research is published.</p></div>}
      <div className="coverage-banner"><span>FOUNDING COVERAGE</span><h2>This owner’s manual is ready to be built.</h2><p>The company and ticker are now part of the research universe. Verified claims, sources, business-model analysis, theses, filings, and expert contributions will be added through the editorial workflow.</p></div>
      <div className="starter-metrics"><div><small>INDEX MEMBERSHIP</small><strong>{company.memberships.join(" · ") || "No tracked membership"}</strong></div><div><small>{company.exchange === "OTC" ? "ISSUE TYPE" : "SECTOR"}</small><strong>{company.exchange === "OTC" ? company.securityType : company.sector}</strong></div><div><small>MARKET</small><strong>{company.exchange}</strong></div><div><small>DOSSIER STATUS</small><strong className="amber-text">Not yet researched</strong></div></div>
      {universeCompany && company.exchange !== "OTC" && <MarketDataPanel ticker={company.ticker} exchange={company.exchange} />}
      <ResearchFoundationPanel ticker={company.ticker} companyName={displayName(company.name)} />
      <EarningsCallsPanel ticker={company.ticker} />
      <div className="starter-sections">
        {["Owner’s summary","Business model","Why own it","Why not own it","Financial dashboard","What changed","Earnings & filings","Competitive landscape"].map((section, index) => <div key={section}><span>{String(index + 1).padStart(2,"0")}</span><strong>{section}</strong><em>{section === "Earnings & filings" ? "SEC links available" : "Awaiting research"}</em></div>)}
      </div>
      <SecFilingsPanel ticker={company.ticker} />
      <CommunityInsights ticker={company.ticker} />
      <div className="coverage-actions"><div><span className="kicker">HELP BUILD THIS DOSSIER</span><h2>Know this business deeply?</h2><p>Submit a fact, source, correction, or question for management. Every contribution is reviewed before publication.</p></div><Link className="button dark-button" href={`/contribute?ticker=${encodeURIComponent(company.ticker)}`}>Start a contribution →</Link></div>
    </section>
  </main>;
}
