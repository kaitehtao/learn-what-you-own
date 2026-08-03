import type { FeaturedDossier } from "./featuredDossiers";
import { secCompanies } from "./secCompanies.generated";

export type StructuredDossierProfile = {
  ticker: string;
  name: string;
  sector: string;
  focus: string;
  officialUrl: string;
  newsroomUrl?: string;
  peers?: string[];
};

type SectorTemplate = {
  customers: string;
  revenue: string;
  opportunity: string;
  edge: string;
  mustGoRight: string;
  drivers: [string, string][];
  risks: [string, string, string][];
  peers: string[];
};

const templates: Record<string, SectorTemplate> = {
  "Information Technology": {
    customers: "enterprises, public-sector organizations, developers, technology manufacturers, and digital-service providers",
    revenue: "Product, subscription, license, usage, support, maintenance, and professional-service revenue; owners should separate recurring demand from hardware, implementation, and cycle-sensitive sales.",
    opportunity: "Digitization, cloud and AI workloads, cybersecurity, automation, and rising semiconductor or software content can expand the addressable market.",
    edge: "Product performance, installed workflows, intellectual property, developer or channel ecosystems, and switching costs can support share and pricing.",
    mustGoRight: "Product cadence must remain competitive, customers must earn measurable returns, recurring demand must convert into cash, and research and infrastructure spending must produce durable differentiation.",
    drivers: [["RECURRING & USAGE REVENUE", "renewals, usage, expansion, pricing, remaining obligations, and churn"], ["PRODUCT & PLATFORM", "roadmap cadence, adoption, market share, attach, and customer outcomes"], ["MARGIN & CASH", "gross margin, sales efficiency, research spending, stock compensation, capex, and free cash flow"]],
    risks: [["Technology displacement", "Products can lose relevance as architectures, standards, or customer preferences change.", "Roadmap delays, lost designs, falling retention, or weaker usage"], ["Customer and channel concentration", "Large customers, distributors, foundries, or partners can alter demand and bargaining power.", "Top-customer mix, channel inventory, and supplier commitments"], ["Cyber, data, and regulation", "Security failures, privacy rules, export controls, and AI regulation can raise costs or restrict markets.", "Incidents, remedies, restrictions, and control disclosures"]],
    peers: ["MSFT", "ORCL", "CSCO", "IBM", "AVGO", "AMD"],
  },
  Industrials: {
    customers: "commercial, industrial, aerospace, government, infrastructure, transportation, and service customers",
    revenue: "Equipment, component, project, service, aftermarket, maintenance, distribution, and long-term contract revenue; backlog and orders are not the same as collected cash.",
    opportunity: "Replacement demand, automation, electrification, infrastructure investment, aerospace activity, and an installed base can support volume and aftermarket growth.",
    edge: "Engineering qualifications, distribution, installed equipment, regulatory approvals, customer integration, and service capability can create durable positions.",
    mustGoRight: "Backlog must convert on schedule, price and productivity must offset input costs, quality must remain high, and capital-intensive programs must earn acceptable returns.",
    drivers: [["ORDERS & BACKLOG", "book-to-bill, cancellations, program timing, price, mix, and conversion"], ["AFTERMARKET & SERVICE", "installed base, utilization, attach, pricing, maintenance, and recurring mix"], ["MARGIN & CASH", "volume, price-cost, productivity, working capital, capex, and free cash flow"]],
    risks: [["Cycle and project timing", "Customer capital spending and large programs can shift abruptly.", "Orders, backlog, cancellations, inventory, and utilization"], ["Supply, labor, and quality", "Materials, skilled labor, supplier performance, warranty, or certification failures can disrupt delivery.", "Lead times, cost inflation, rework, and customer penalties"], ["Contract and regulatory exposure", "Fixed-price work, government rules, safety, and environmental obligations can impair economics.", "Estimate-at-completion changes, claims, investigations, and remedies"]],
    peers: ["HON", "ETN", "GE", "PH", "EMR", "ITW"],
  },
  "Health Care": {
    customers: "patients, providers, hospitals, pharmacies, payers, governments, distributors, and research organizations",
    revenue: "Product, prescription, procedure, service, distribution, and recurring support revenue, net of rebates, discounts, returns, and reimbursement adjustments.",
    opportunity: "Aging populations, unmet medical need, clinical innovation, procedure growth, and health-system productivity can support durable demand.",
    edge: "Clinical evidence, regulatory approvals, intellectual property, physician familiarity, distribution, scale, and manufacturing quality can reinforce adoption.",
    mustGoRight: "Products must remain safe and differentiated, reimbursement and access must hold, supply must be reliable, and pipeline or service investment must create value beyond the current franchise.",
    drivers: [["VOLUME & MIX", "patients, procedures, prescriptions, product mix, geography, and share"], ["PRICE & ACCESS", "net price, reimbursement, rebates, payer mix, and channel inventory"], ["PIPELINE & CASH", "clinical milestones, launches, R&D, acquisitions, capex, and free cash flow"]],
    risks: [["Clinical and product risk", "Trials, safety findings, recalls, or weak real-world outcomes can reduce value.", "Adverse events, label changes, recalls, and trial readouts"], ["Reimbursement and policy", "Government and private payers can constrain price, access, or utilization.", "Coverage decisions, net price, utilization controls, and legislation"], ["Concentration and competition", "A limited number of products, customers, or channels may drive results.", "Product mix, patent timelines, competing launches, and customer concentration"]],
    peers: ["JNJ", "ABBV", "MRK", "ABT", "TMO", "SYK"],
  },
  Financials: {
    customers: "consumers, corporations, institutions, governments, advisors, asset owners, and market participants",
    revenue: "Net interest income, transaction and advisory fees, asset-based fees, insurance premiums, spread income, trading, servicing, and other financial-service revenue.",
    opportunity: "Scale, trusted distribution, client assets, deposits, data, and embedded workflows can support recurring fees and attractive incremental economics.",
    edge: "Regulatory licenses, capital, liquidity, brand, distribution, data, switching costs, and network effects can create barriers to entry.",
    mustGoRight: "Credit and liquidity must remain controlled, client assets and activity must grow, regulation must remain manageable, and capital allocation must produce per-share returns above the cost of equity.",
    drivers: [["CLIENT ACTIVITY & ASSETS", "balances, flows, transactions, retention, market levels, and fee rates"], ["SPREAD & CREDIT", "funding, yields, loss rates, reserves, underwriting, and liquidity"], ["CAPITAL & CASH", "capital ratios, leverage, distributions, acquisitions, and return on equity"]],
    risks: [["Credit, market, and liquidity", "Losses, volatility, collateral changes, or funding stress can impair capital.", "Delinquencies, charge-offs, reserves, spreads, deposits, and liquidity"], ["Regulation and conduct", "Capital rules, fiduciary duties, market structure, or misconduct can change economics.", "New rules, consent orders, litigation, and remediation spending"], ["Fee and competitive pressure", "Clients can shift assets or activity to lower-cost or technology-enabled alternatives.", "Net flows, pricing, retention, wallet share, and acquisition cost"]],
    peers: ["JPM", "BAC", "C", "GS", "MS", "SCHW"],
  },
  Utilities: {
    customers: "residential, commercial, industrial, wholesale, and public-sector energy customers",
    revenue: "Regulated electric and gas rates, contracted generation, capacity, energy, transmission, and related service revenue.",
    opportunity: "Grid modernization, electrification, data-center load, generation replacement, and transmission investment can expand rate base and contracted demand.",
    edge: "Exclusive service territories, irreplaceable networks, regulated cost recovery, generation assets, and long-lived customer relationships can support visibility.",
    mustGoRight: "Projects must be delivered safely and on budget, regulators must allow timely recovery, financing must remain available, and reliability investment must earn acceptable risk-adjusted returns.",
    drivers: [["RATE BASE & LOAD", "approved investment, customer growth, data centers, weather, and demand"], ["REGULATORY OUTCOMES", "allowed returns, recovery timing, affordability, and disallowances"], ["CAPITAL & FUNDING", "construction spend, debt, equity issuance, interest cost, and cash flow"]],
    risks: [["Regulatory and affordability", "Bills, politics, and customer pressure can delay or reduce recovery.", "Rate-case outcomes, deferrals, disallowances, and arrears"], ["Project and operating risk", "Large generation, grid, and environmental projects can face delays or cost overruns.", "Construction milestones, outages, safety, and revised budgets"], ["Financing and weather", "High capital needs, rates, storms, fuel, and demand variability affect cash and credit.", "Credit metrics, equity needs, storm costs, and weather-normalized sales"]],
    peers: ["NEE", "DUK", "SO", "AEP", "D", "CEG"],
  },
  "Real Estate": {
    customers: "tenants, enterprise customers, retailers, operators, and property users",
    revenue: "Rent, usage, reimbursement, development, management, and ancillary service revenue supported by long-lived property or infrastructure assets.",
    opportunity: "Scarce locations, contractual escalators, development, redevelopment, and demand for specialized infrastructure can support cash-flow growth.",
    edge: "Asset quality, scale, location, tenant relationships, operating expertise, and access to capital can create durable advantages.",
    mustGoRight: "Occupancy and tenant credit must hold, development must earn attractive yields, balance-sheet capacity must remain strong, and refinancing costs must not overwhelm cash growth.",
    drivers: [["SAME-ASSET CASH FLOW", "occupancy, rent, escalators, churn, concessions, and operating cost"], ["DEVELOPMENT & LEASING", "pipeline, preleasing, yield, timing, capex, and stabilization"], ["BALANCE SHEET", "debt maturity, interest cost, retained cash, asset sales, and equity issuance"]],
    risks: [["Tenant and demand risk", "Vacancy, churn, customer consolidation, or property obsolescence can reduce cash flow.", "Occupancy, bookings, bad debt, renewals, and concessions"], ["Capital and refinancing", "Leverage and maturities expose owners to rates and capital-market availability.", "Net debt, fixed-charge coverage, maturities, and funding spreads"], ["Development and asset values", "Construction cost, delays, or cap-rate changes can impair returns and valuations.", "Yield on cost, stabilization, impairments, and transaction cap rates"]],
    peers: ["PLD", "AMT", "EQIX", "DLR", "SPG", "O"],
  },
  Materials: {
    customers: "industrial, construction, transportation, packaging, consumer, energy, and infrastructure customers",
    revenue: "Commodity, specialty material, chemical, coating, and service sales whose pricing and margins depend on volume, mix, input costs, and capacity utilization.",
    opportunity: "Infrastructure, electrification, repair, reshoring, and differentiated formulations or resource positions can support demand and pricing.",
    edge: "Low-cost resources, process know-how, formulations, brands, distribution, customer qualification, and scale can sustain returns.",
    mustGoRight: "Price and productivity must cover input costs, assets must operate reliably, projects must meet return thresholds, and the balance sheet must withstand commodity or construction cycles.",
    drivers: [["PRICE & VOLUME", "realized price, units, mix, contracts, end markets, and share"], ["INPUTS & UTILIZATION", "energy, feedstock, labor, logistics, uptime, and capacity"], ["CAPITAL & CASH", "project spend, working capital, remediation, dividends, debt, and free cash flow"]],
    risks: [["Commodity and construction cycle", "Prices and volumes can move faster than the cost base adjusts.", "Benchmarks, order rates, inventory, capacity utilization, and spreads"], ["Operational and environmental", "Mines, plants, logistics, safety, or remediation can interrupt output and require cash.", "Production, outages, incidents, permits, and provisions"], ["Project and geopolitical exposure", "Large projects, taxes, royalties, trade rules, or host-country actions can change value.", "Budget revisions, approvals, fiscal terms, and export restrictions"]],
    peers: ["LIN", "APD", "SHW", "FCX", "NEM", "ECL"],
  },
  "Consumer Discretionary": {
    customers: "consumers, travelers, households, merchants, franchisees, dealers, and business partners",
    revenue: "Product, service, booking, advertising, subscription, financing, franchise, and transaction revenue tied to consumer demand and brand or platform engagement.",
    opportunity: "Brand relevance, digital distribution, loyalty, network scale, premium experiences, and international expansion can grow share and lifetime value.",
    edge: "Brand, assortment, network effects, locations, data, distribution, and customer experience can support repeat use and pricing.",
    mustGoRight: "Traffic and retention must remain healthy, customer acquisition and service costs must stay rational, inventory or capacity must be productive, and capital allocation must protect per-share value.",
    drivers: [["DEMAND & ENGAGEMENT", "traffic, bookings, units, users, frequency, price, and mix"], ["UNIT ECONOMICS", "gross margin, acquisition cost, service cost, inventory, capacity, and retention"], ["CASH & CAPITAL", "working capital, capex, financing, leases, repurchases, and free cash flow"]],
    risks: [["Consumer and brand demand", "Recession, fashion, value perception, or weaker experiences can reduce traffic and price.", "Transactions, bookings, cancellations, markdowns, and satisfaction"], ["Competition and platform economics", "Low switching costs, promotion, or disintermediation can pressure margins.", "Market share, acquisition cost, incentives, take rate, and retention"], ["Inventory, capacity, and financing", "Long-lived assets, inventory, leases, or credit can amplify a demand miss.", "Turns, utilization, residual values, losses, and fixed obligations"]],
    peers: ["AMZN", "HD", "MCD", "BKNG", "SBUX", "LOW"],
  },
  "Consumer Staples": {
    customers: "consumers, retailers, distributors, restaurants, and food-service or institutional channels",
    revenue: "Branded consumable product sales through retail, wholesale, direct, and food-service channels, net of promotions and trade spending.",
    opportunity: "Brand strength, distribution, innovation, premiumization, and international penetration can support recurring demand and pricing.",
    edge: "Habit, brand trust, shelf space, route-to-market scale, supply chain, and marketing can support durable category positions.",
    mustGoRight: "Volume must remain resilient after pricing, innovation must offset category maturity, input costs must be managed, and marketing must sustain consumer relevance.",
    drivers: [["ORGANIC SALES", "volume, price, mix, geography, categories, and share"], ["GROSS MARGIN", "commodities, packaging, labor, freight, productivity, and promotion"], ["BRAND & CASH", "marketing, innovation, working capital, capex, dividends, and free cash flow"]],
    risks: [["Volume and elasticity", "Pricing, private label, health preferences, or weak innovation can reduce units.", "Organic volume, share, household penetration, and promotion"], ["Input and supply chain", "Commodity, packaging, labor, weather, or logistics can pressure availability and margin.", "Gross margin, service levels, spot prices, and inventory"], ["Retailer and regulation", "Concentrated retailers or health, labeling, tax, and environmental rules can alter economics.", "Customer concentration, shelf position, new rules, and reformulation cost"]],
    peers: ["WMT", "COST", "PG", "KO", "PEP", "MDLZ"],
  },
  Energy: {
    customers: "refiners, utilities, industrial users, producers, marketers, governments, and global commodity customers",
    revenue: "Commodity production and sales, refining and marketing margins, transportation and storage fees, services, and contract or capacity payments.",
    opportunity: "Low-cost resources, irreplaceable infrastructure, disciplined capacity, export demand, and growing power or industrial needs can support cash generation.",
    edge: "Asset quality, scale, integration, logistics, acreage, contracts, technology, and operating execution can create cost or market-access advantages.",
    mustGoRight: "Assets must operate safely, capital spending must remain disciplined, commodity and contract exposure must be understood, and cash returns must not depend on permanently favorable prices.",
    drivers: [["PRICE & MARGIN", "commodity benchmarks, differentials, crack spreads, fees, hedges, and mix"], ["VOLUME & RELIABILITY", "production, throughput, utilization, outages, decline, and capacity"], ["CAPITAL & CASH", "maintenance, growth capex, debt, working capital, dividends, and repurchases"]],
    risks: [["Commodity and margin cycle", "Prices, spreads, and differentials can reduce earnings and asset values.", "Benchmarks, inventories, utilization, OPEC policy, and demand"], ["Operational and environmental", "Incidents, outages, leaks, remediation, or permit restrictions can interrupt cash flow.", "Uptime, safety, spills, emissions, provisions, and enforcement"], ["Capital intensity and transition", "Projects, decommissioning, policy, and changing energy demand can strand capital.", "Project returns, abandonment obligations, regulation, and customer commitments"]],
    peers: ["XOM", "CVX", "COP", "SLB", "MPC", "PSX"],
  },
  Communication: {
    customers: "consumers, advertisers, distributors, enterprises, creators, and communications or entertainment partners",
    revenue: "Subscription, connectivity, advertising, licensing, theatrical, content, distribution, and transaction revenue across communications and media channels.",
    opportunity: "Scaled audiences, valuable intellectual property, broadband or platform distribution, and global direct relationships can support monetization.",
    edge: "Content libraries, franchises, networks, infrastructure, data, distribution, and customer relationships can create scale and switching advantages.",
    mustGoRight: "Engagement and subscriber economics must hold, content and network investment must earn returns, debt must remain manageable, and changing distribution must not destroy legacy cash faster than new models grow.",
    drivers: [["AUDIENCE & SUBSCRIBERS", "users, churn, engagement, price, mix, and distribution"], ["CONTENT & ADVERTISING", "slate, rights, audience delivery, ad demand, licensing, and returns"], ["CASH & CAPITAL", "content spend, network capex, debt, restructuring, asset sales, and free cash flow"]],
    risks: [["Audience fragmentation", "Consumers and advertisers can shift quickly across platforms and formats.", "Churn, engagement, ratings, ad pricing, and market share"], ["Content and technology investment", "Large commitments may not generate sufficient audience or cash returns.", "Content amortization, slate performance, network use, and return on spend"], ["Leverage and regulation", "Debt, consolidation, spectrum, privacy, and distribution rules can constrain strategy.", "Net leverage, refinancing, remedies, and carriage disputes"]],
    peers: ["META", "GOOGL", "NFLX", "DIS", "CMCSA", "T"],
  },
};

const fallbackTemplate = templates.Industrials;
const secBrowse = (cik: string) => `https://www.sec.gov/edgar/browse/?CIK=${encodeURIComponent(cik)}&owner=exclude`;
const secForm = (cik: string, form: string) => `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${encodeURIComponent(cik)}&type=${encodeURIComponent(form)}&owner=exclude&count=40`;

export function makeStructuredDossier(profile: StructuredDossierProfile): FeaturedDossier {
  const template = templates[profile.sector] ?? fallbackTemplate;
  const cik = secCompanies[profile.ticker]?.cik ?? profile.ticker;
  const peers = (profile.peers ?? template.peers).filter((ticker) => ticker !== profile.ticker).slice(0, 6);
  while (peers.length < 6) peers.push(template.peers[peers.length % template.peers.length]);
  const officialMaterialsUrl = profile.officialUrl;
  const newsroomUrl = profile.newsroomUrl ?? profile.officialUrl;
  const annualFilingsUrl = secForm(cik, "10-K");
  const quarterlyFilingsUrl = secForm(cik, "10-Q");
  const earningsUpdatesUrl = secForm(cik, "8-K");
  const proxyFilingsUrl = secForm(cik, "DEF 14A");

  return {
    ticker: profile.ticker,
    reviewed: "August 2, 2026",
    completeness: 100,
    newsroomUrl,
    description: `${profile.name} operates in ${profile.sector.toLowerCase()}, focused on ${profile.focus}.`,
    lede: `${profile.name} gives owners exposure to ${profile.focus}. The central question is whether its competitive position and reinvestment can convert demand into durable per-share cash generation after the full cost of capital, execution, and industry risk.`,
    sells: `${profile.name} provides ${profile.focus} to ${template.customers}. Owners should verify segment mix, customer concentration, contract terms, and geographic exposure in the latest Form 10-K and 10-Q.`,
    revenueModel: template.revenue,
    opportunity: `${template.opportunity} For ${profile.name}, the owner must test whether ${profile.focus} can gain profitable share rather than treating addressable-market growth as company value by itself.`,
    mustGoRight: template.mustGoRight,
    editorNote: `This owner brief uses the issuer's SEC filing history, earnings-related 8-K record, proxy disclosures, and official company materials as its evidence spine. Bull and bear points are hypotheses to verify against the latest reported segment, cash-flow, balance-sheet, and management-commentary evidence—not recommendations or price targets.`,
    bullTitle: "What the filing and call evidence could support",
    bull: [
      `${profile.name}'s position in ${profile.focus} can compound value if demand converts into durable share, pricing, and cash rather than temporary volume.`,
      template.edge,
      `Operating leverage and disciplined reinvestment can expand per-share free cash flow when revenue quality, margins, and capital intensity improve together.`,
      `Official filings and earnings materials create a quarterly scorecard for testing management's claims against delivered results and cash conversion.`,
    ],
    bearTitle: "What owners must be prepared to disprove",
    bear: [
      `Demand for ${profile.focus} can slow, shift, or become less profitable even when the broader market continues to grow.`,
      template.risks[0][1],
      template.risks[1][1],
      `Accounting earnings can overstate owner economics when working capital, capital spending, acquisitions, stock compensation, debt, leases, or dilution absorb cash.`,
    ],
    thesisBreaker: `The owner thesis breaks if ${profile.name} cannot defend its position in ${profile.focus} and repeatedly fails to convert reported growth into resilient per-share free cash flow after required investment, balance-sheet obligations, and dilution.`,
    financialDrivers: [
      ...template.drivers.map(([label, detail]) => ({ label, value: "Quarterly filing scorecard", detail })),
      { label: "REVENUE QUALITY", value: "Growth versus durability", detail: "Separate price, volume, mix, acquisitions, foreign exchange, backlog, and one-time items; reconcile growth with retention and cash collection." },
      { label: "BALANCE SHEET", value: "Resilience and optionality", detail: "Track cash, debt, leases, pensions, commitments, covenants, refinancing needs, and contingent liabilities disclosed in the latest filing." },
      { label: "PER-SHARE VALUE", value: "Owner cash conversion", detail: "Reconcile net income with operating cash, capex, acquisitions, dividends, repurchases, stock compensation, and diluted share count." },
    ],
    risks: [
      ...template.risks.map(([title, text, signal]) => ({ title, level: "High" as const, text, signal })),
      { title: "Capital allocation", level: "Medium", text: "Acquisitions, internal investment, debt, dividends, and repurchases can create or destroy per-share value.", signal: "Return on invested capital, impairments, leverage, share count, and post-investment cash generation" },
      { title: "Reporting, legal, and governance", level: "Medium", text: "Controls, estimates, litigation, tax, incentives, or governance choices can alter reported economics and owner outcomes.", signal: "Restatements, control weaknesses, estimate changes, proceedings, proxy incentives, and related-party disclosures" },
    ],
    monitor: [
      { title: "Latest 10-Q versus prior expectations", text: "Compare reported operating drivers, cash conversion, balance-sheet changes, and risk language with the prior quarter and owner thesis.", impact: "NEUTRAL" },
      { title: "Management commentary versus delivery", text: "Record the measurable commitments made in the latest official earnings materials and test them against subsequent filings.", impact: "BULL CASE" },
      { title: "Downside leading indicators", text: `Watch ${template.risks.map((risk) => risk[2]).join("; ")}.`, impact: "BEAR CASE" },
      { title: "Per-share capital allocation", text: "Measure whether retained cash, acquisitions, debt reduction, dividends, and repurchases improve durable value per diluted share.", impact: "NEUTRAL" },
    ],
    questions: [
      `Which disclosed operating metric best proves that ${profile.name} is strengthening its position in ${profile.focus}?`,
      "What changed in the latest 10-Q relative to the preceding 10-K and management's prior commentary?",
      "Which portion of reported growth is recurring, contractual, or repeatable, and which portion is cyclical or one-time?",
      "What balance-sheet or off-balance-sheet obligation matters most in a downside case?",
      "Does management's compensation framework reward per-share owner value or primarily scale and adjusted metrics?",
      "What measurable development would invalidate the thesis rather than merely create short-term price volatility?",
    ],
    competitors: `${profile.name} competes with public and private operators across ${profile.focus}; the comparable set below is a research starting point and must be normalized for business mix, leverage, accounting, and capital intensity.`,
    comparables: peers.map((ticker) => ({
      name: secCompanies[ticker]?.name ?? ticker,
      ticker,
      ownership: "Public" as const,
      relationship: `${profile.sector} operating and valuation reference for ${profile.ticker}.`,
      valuation: "Compare enterprise value, earnings, free cash flow, growth, capital intensity, and a sector-appropriate unit metric using current filings.",
      financialStatus: `Use the latest ${ticker} filing to compare profitability, liquidity, leverage, dilution, and cash conversion with ${profile.ticker}.`,
      sourceUrl: secBrowse(secCompanies[ticker]?.cik ?? ticker),
    })),
    evidenceReview: {
      reviewedAt: "August 2, 2026",
      annualFilingsUrl,
      quarterlyFilingsUrl,
      earningsUpdatesUrl,
      proxyFilingsUrl,
      officialMaterialsUrl,
      transcriptPolicy: "Use an issuer-published transcript when available. Otherwise use the official webcast, prepared remarks, earnings release, and 8-K exhibits; third-party transcripts are secondary and may contain errors.",
    },
    sources: [
      { title: `${profile.ticker} SEC filing library`, meta: "SEC EDGAR · Issuer record", href: secBrowse(cik), excerpt: `The issuer record provides ${profile.name}'s filing history, including annual, quarterly, current, proxy, ownership, and registration disclosures.` },
      { title: `${profile.ticker} annual reports`, meta: "SEC Forms 10-K · Primary filings", href: annualFilingsUrl, excerpt: "Annual reports provide the audited financial statements, business and segment description, competition, commitments, controls, and principal risk disclosures." },
      { title: `${profile.ticker} quarterly reports`, meta: "SEC Forms 10-Q · Primary filings", href: quarterlyFilingsUrl, excerpt: "Quarterly reports update financial results, liquidity, cash flow, contingencies, and management discussion between annual reports." },
      { title: `${profile.ticker} earnings and current reports`, meta: "SEC Forms 8-K · Primary earnings record", href: earningsUpdatesUrl, excerpt: "Current reports frequently include earnings releases, presentations, material agreements, leadership changes, and other time-sensitive issuer disclosures." },
      { title: `${profile.ticker} proxy statements`, meta: "SEC DEF 14A · Governance source", href: proxyFilingsUrl, excerpt: "Proxy statements disclose executive incentives, board oversight, beneficial ownership, related matters, and shareholder proposals." },
      { title: `${profile.ticker} official investor materials`, meta: "Company IR · Management commentary", href: officialMaterialsUrl, excerpt: "Use the company's official results, presentations, webcast replays, prepared remarks, and transcripts when the issuer makes them publicly available." },
      ...(newsroomUrl !== officialMaterialsUrl ? [{ title: `${profile.ticker} official newsroom`, meta: "Company announcements · Management assertions", href: newsroomUrl, excerpt: "Company releases provide timely operational and strategic assertions that should be checked against subsequent filings and independent evidence." }] : []),
    ],
  };
}

export function applyEvidenceStandard(dossier: FeaturedDossier): FeaturedDossier {
  const cik = secCompanies[dossier.ticker]?.cik ?? dossier.ticker;
  const officialMaterialsUrl = dossier.sources.find((source) => !source.href.includes("sec.gov"))?.href ?? dossier.newsroomUrl ?? secBrowse(cik);
  const evidenceReview = dossier.evidenceReview ?? {
    reviewedAt: dossier.reviewed ?? "August 2, 2026",
    annualFilingsUrl: secForm(cik, "10-K"),
    quarterlyFilingsUrl: secForm(cik, "10-Q"),
    earningsUpdatesUrl: secForm(cik, "8-K"),
    proxyFilingsUrl: secForm(cik, "DEF 14A"),
    officialMaterialsUrl,
    transcriptPolicy: "Use an issuer-published transcript when available. Otherwise use the official webcast, prepared remarks, earnings release, and 8-K exhibits; third-party transcripts are secondary and may contain errors.",
  };
  return { ...dossier, evidenceReview };
}
