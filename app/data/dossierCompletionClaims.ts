export type CompletionSource = {
  title: string;
  url: string;
  evidenceDate: string;
  excerpt: string;
  sourceType: string;
};

export type CompletionNarrative = {
  lede: string;
  sells: string;
  revenueModel: string;
  opportunity: string;
  mustGoRight: string;
  thesisBreaker: string;
  bull: string[];
  bear: string[];
  financialDrivers: { label: string; value: string; detail: string }[];
  risks: { title: string; text: string; signal: string }[];
};

export type CompletionClaim = {
  section: string;
  claimType: "verified_fact" | "editorial_analysis";
  claim: string;
  whyItMatters: string;
  sourceTitle: string;
  sourceUrl: string;
  sourceExcerpt: string;
  evidenceDate: string;
};

function claim(
  section: string,
  claimType: CompletionClaim["claimType"],
  text: string,
  whyItMatters: string,
  source: CompletionSource,
): CompletionClaim {
  return {
    section,
    claimType,
    claim: text.trim(),
    whyItMatters,
    sourceTitle: source.title,
    sourceUrl: source.url,
    sourceExcerpt: source.excerpt,
    evidenceDate: source.evidenceDate,
  };
}

export function buildCompletionClaims(narrative: CompletionNarrative, sources: CompletionSource[]) {
  if (sources.length < 2) throw new Error("At least two exact sources are required to prepare a completion packet.");
  const annual = sources.find((source) => /10-k|annual/i.test(`${source.title} ${source.sourceType}`)) ?? sources[0];
  const company = sources.find((source) => !source.url.includes("sec.gov")) ?? sources[1] ?? annual;
  const quarterly = sources.find((source) => /10-q|quarter/i.test(`${source.title} ${source.sourceType}`)) ?? annual;
  const bull = narrative.bull.find(Boolean);
  const bear = narrative.bear.find(Boolean);
  const driver = narrative.financialDrivers.find((item) => item.label && item.detail);
  const risk = narrative.risks.find((item) => item.title && item.text);
  if (!bull || !bear || !driver || !risk) throw new Error("Bull, bear, financial-driver, and risk sections must be complete.");

  return [
    claim("owner_summary", "editorial_analysis", narrative.lede, "Defines the central owner lens and the variables that determine long-term value.", annual),
    claim("business_model", "verified_fact", narrative.sells, "Identifies the products, services, and customers that produce revenue.", annual),
    claim("revenue_model", "editorial_analysis", narrative.revenueModel, "Explains how operating activity converts into reported revenue and owner economics.", annual),
    claim("opportunity", "editorial_analysis", narrative.opportunity, "States the evidence-grounded route by which the business could expand value.", company),
    claim("owner_requirements", "editorial_analysis", narrative.mustGoRight, "Makes the operating and capital-allocation requirements of the thesis falsifiable.", annual),
    claim("thesis_breaker", "editorial_analysis", narrative.thesisBreaker, "Defines the evidence that would invalidate the ownership case.", annual),
    claim("bull_case", "editorial_analysis", bull, "Supports the constructive side of the balanced investment debate.", company),
    claim("bear_case", "editorial_analysis", bear, "Supports the skeptical side of the balanced investment debate.", annual),
    claim("financial_drivers", "editorial_analysis", `${driver.label}: ${driver.value} — ${driver.detail}`, "Identifies a measurable driver owners should update from each filing.", quarterly),
    claim("risks", "editorial_analysis", `${risk.title}: ${risk.text}`, `Leading indicator: ${risk.signal}`, annual),
  ];
}

export function completionClaimMetrics(claims: CompletionClaim[]) {
  return {
    claims: claims.length,
    sections: new Set(claims.map((item) => item.section)).size,
    claimTypes: new Set(claims.map((item) => item.claimType)).size,
    sourceUrls: new Set(claims.map((item) => item.sourceUrl)).size,
  };
}
