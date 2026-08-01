export type ExternalIntelligenceSource = {
  key: string;
  name: string;
  publisher: string;
  category: string;
  description: string;
  dossierUse: string;
  caution: string;
  href: string;
  access: "U.S. government open data" | "CC0 open data";
  sectors: string[];
  tickers?: string[];
  priority?: number;
};

// These sources add operating, regulatory, scientific, and industry evidence
// that is not normally organized inside an issuer's SEC filing. A source being
// listed is a research path, not evidence that the company has a matching record.
export const externalIntelligenceSources: ExternalIntelligenceSource[] = [
  {
    key: "usaspending",
    name: "USAspending.gov",
    publisher: "U.S. Department of the Treasury",
    category: "Government business",
    description: "Federal contracts, grants, agencies, award values, recipients, and periods of performance.",
    dossierUse: "Test government-customer exposure and build an award history outside management commentary.",
    caution: "Recipient names and subsidiaries require manual parent-company matching.",
    href: "https://www.usaspending.gov/",
    access: "U.S. government open data",
    sectors: ["Industrials", "Information Technology", "Health Care", "Energy", "Communication Services", "Materials"],
    priority: 1,
  },
  {
    key: "uspto",
    name: "USPTO Open Data",
    publisher: "U.S. Patent and Trademark Office",
    category: "Patents & innovation",
    description: "Patent applications, grants, assignees, inventors, and technology classifications.",
    dossierUse: "Map technical activity, inventor networks, product adjacencies, and competing assignees.",
    caution: "Patent counts do not measure commercial quality; assignee-name changes must be normalized.",
    href: "https://data.uspto.gov/",
    access: "U.S. government open data",
    sectors: ["Information Technology", "Industrials", "Health Care", "Consumer Discretionary", "Communication Services", "Energy", "Materials"],
    priority: 2,
  },
  {
    key: "epa-echo",
    name: "EPA ECHO",
    publisher: "U.S. Environmental Protection Agency",
    category: "Facilities & compliance",
    description: "Facility inspections, permits, violations, enforcement actions, and penalties.",
    dossierUse: "Add location-level operating and environmental compliance evidence.",
    caution: "A facility must be verified as owned or operated by the researched company during the relevant period.",
    href: "https://echo.epa.gov/",
    access: "U.S. government open data",
    sectors: ["Energy", "Industrials", "Materials", "Utilities", "Consumer Staples"],
    priority: 2,
  },
  {
    key: "nhtsa",
    name: "NHTSA Safety Data",
    publisher: "National Highway Traffic Safety Administration",
    category: "Product safety",
    description: "Vehicle recalls, complaints, investigations, and manufacturer communications.",
    dossierUse: "Track product-quality signals and regulatory escalation by vehicle, model, and manufacturer.",
    caution: "Consumer complaints are allegations, not verified defects or proof of causation.",
    href: "https://www.nhtsa.gov/nhtsa-datasets-and-apis",
    access: "U.S. government open data",
    sectors: ["Consumer Discretionary", "Industrials"],
    tickers: ["TSLA", "F", "GM", "RIVN", "LCID", "STLA", "TM", "HMC"],
    priority: 0,
  },
  {
    key: "eia",
    name: "EIA Open Data",
    publisher: "U.S. Energy Information Administration",
    category: "Energy-market conditions",
    description: "Electricity generation, grid capacity, fuel prices, production, demand, and storage.",
    dossierUse: "Place energy producers, equipment suppliers, utilities, and data-center operators in measurable market context.",
    caution: "Industry statistics are contextual evidence and should not be presented as company-reported results.",
    href: "https://www.eia.gov/opendata/",
    access: "U.S. government open data",
    sectors: ["Energy", "Utilities", "Industrials"],
    tickers: ["BE", "FCEL", "CRWV", "VST", "CEG", "NEE", "GEV"],
    priority: 1,
  },
  {
    key: "clinicaltrials",
    name: "ClinicalTrials.gov",
    publisher: "U.S. National Library of Medicine",
    category: "Clinical pipeline",
    description: "Trial sponsors, phases, enrollment, endpoints, locations, status, and posted results.",
    dossierUse: "Build a structured clinical-program timeline and identify delayed, completed, or terminated studies.",
    caution: "Study information is submitted by sponsors and is not necessarily validated by the U.S. government.",
    href: "https://clinicaltrials.gov/data-api/about-api",
    access: "U.S. government open data",
    sectors: ["Health Care"],
    priority: 0,
  },
  {
    key: "openfda",
    name: "openFDA",
    publisher: "U.S. Food and Drug Administration",
    category: "Regulatory & safety",
    description: "Approvals, device clearances, labels, recalls, shortages, and adverse-event reports.",
    dossierUse: "Connect regulatory milestones and safety signals to products and manufacturers.",
    caution: "Adverse-event reports do not establish that a product caused the reported event.",
    href: "https://open.fda.gov/",
    access: "U.S. government open data",
    sectors: ["Health Care", "Consumer Staples"],
    priority: 1,
  },
  {
    key: "nih-reporter",
    name: "NIH RePORTER",
    publisher: "National Institutes of Health",
    category: "Funded research",
    description: "Federal scientific awards, investigators, funded organizations, publications, and project abstracts.",
    dossierUse: "Identify publicly funded science, research collaborators, and emerging technology around a company or market.",
    caution: "A grant to a researcher or university does not prove a commercial relationship with a company.",
    href: "https://api.reporter.nih.gov/",
    access: "U.S. government open data",
    sectors: ["Health Care"],
    priority: 2,
  },
  {
    key: "bls",
    name: "BLS Public Data",
    publisher: "U.S. Bureau of Labor Statistics",
    category: "Labor & cost conditions",
    description: "Industry employment, wages, productivity, inflation, and occupational conditions.",
    dossierUse: "Measure labor availability, wage pressure, hiring cycles, and industry productivity.",
    caution: "BLS series describe industries or geographies, not a specific issuer's workforce.",
    href: "https://www.bls.gov/developers/",
    access: "U.S. government open data",
    sectors: ["All"],
    priority: 4,
  },
  {
    key: "census",
    name: "Census Data API",
    publisher: "U.S. Census Bureau",
    category: "Market & demographics",
    description: "Population, trade, business formation, geographic, and industry statistics.",
    dossierUse: "Estimate market structure, local demand, geographic exposure, and business-density trends.",
    caution: "Aggregate data cannot be used to identify a confidential Census respondent or establishment.",
    href: "https://www.census.gov/data/developers.html",
    access: "U.S. government open data",
    sectors: ["Consumer Discretionary", "Consumer Staples", "Real Estate", "Financials", "Communication Services"],
    tickers: ["AMC"],
    priority: 2,
  },
  {
    key: "bea",
    name: "BEA Data API",
    publisher: "U.S. Bureau of Economic Analysis",
    category: "Industry economics",
    description: "Industry output, value added, input-output relationships, and regional economic activity.",
    dossierUse: "Compare company claims with the growth, inputs, and cyclicality of its wider industry.",
    caution: "Industry accounts are contextual and may use classifications that differ from company segments.",
    href: "https://www.bea.gov/resources/for-developers",
    access: "U.S. government open data",
    sectors: ["All"],
    priority: 5,
  },
  {
    key: "cftc-cot",
    name: "CFTC Commitments of Traders",
    publisher: "Commodity Futures Trading Commission",
    category: "Commodity positioning",
    description: "Weekly futures and options positioning grouped by trader category and market.",
    dossierUse: "Add positioning context for businesses exposed to energy, agricultural, metal, or financial markets.",
    caution: "The reports do not identify individual traders or represent company hedging positions.",
    href: "https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm",
    access: "U.S. government open data",
    sectors: ["Energy", "Materials", "Consumer Staples", "Financials"],
    priority: 3,
  },
  {
    key: "openalex",
    name: "OpenAlex",
    publisher: "OurResearch",
    category: "Scientific knowledge",
    description: "Open metadata connecting scholarly works, authors, institutions, funders, and research topics.",
    dossierUse: "Measure research activity and connect technologies to researchers, institutions, and cited work.",
    caution: "Publication volume and citations are discovery signals, not proof of commercial advantage.",
    href: "https://developers.openalex.org/",
    access: "CC0 open data",
    sectors: ["Health Care", "Information Technology", "Industrials", "Materials", "Energy"],
    priority: 3,
  },
  {
    key: "wikidata",
    name: "Wikidata",
    publisher: "Wikimedia community",
    category: "Entity graph",
    description: "Open structured identifiers and relationships for organizations, people, products, industries, and locations.",
    dossierUse: "Bootstrap entity resolution and knowledge-graph links before primary-source verification.",
    caution: "Community-maintained facts require primary-source confirmation before becoming verified dossier claims.",
    href: "https://www.wikidata.org/wiki/Wikidata:Data_access",
    access: "CC0 open data",
    sectors: ["All"],
    priority: 6,
  },
];

const automotiveTickers = new Set(["TSLA", "F", "GM", "RIVN", "LCID", "STLA", "TM", "HMC"]);

export function externalSourcesForCompany(ticker: string, sector: string) {
  const normalizedTicker = ticker.toUpperCase();
  const normalizedSector = sector.trim();
  const matches = externalIntelligenceSources.filter((source) => {
    if (source.tickers?.includes(normalizedTicker)) return true;
    if (source.key === "nhtsa") return automotiveTickers.has(normalizedTicker);
    return source.sectors.includes("All") || source.sectors.includes(normalizedSector);
  });

  return matches
    .sort((a, b) => (a.tickers?.includes(normalizedTicker) ? -1 : 0) - (b.tickers?.includes(normalizedTicker) ? -1 : 0) || (a.priority ?? 99) - (b.priority ?? 99))
    .slice(0, 6);
}
