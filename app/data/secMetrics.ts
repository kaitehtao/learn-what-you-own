export type SecMetricDefinition = {
  key: string;
  label: string;
  concepts: string[];
  preferredUnits: string[];
};

// Concepts are ordered from the modern, broadly used tag to common legacy
// alternatives. Importers merge equivalent concepts and prefer the first one
// when the same reporting period appears under multiple tags.
export const secMetricDefinitions: SecMetricDefinition[] = [
  { key: "revenue", label: "Revenue", concepts: ["RevenueFromContractWithCustomerExcludingAssessedTax", "Revenues", "SalesRevenueNet"], preferredUnits: ["USD"] },
  { key: "gross_profit", label: "Gross profit", concepts: ["GrossProfit"], preferredUnits: ["USD"] },
  { key: "operating_income", label: "Operating income", concepts: ["OperatingIncomeLoss"], preferredUnits: ["USD"] },
  { key: "depreciation_amortization", label: "Depreciation and amortization", concepts: ["DepreciationDepletionAndAmortization", "DepreciationDepletionAndAmortizationPropertyPlantAndEquipment", "DepreciationAndAmortization", "Depreciation"], preferredUnits: ["USD"] },
  { key: "net_income", label: "Net income", concepts: ["NetIncomeLoss", "ProfitLoss"], preferredUnits: ["USD"] },
  { key: "eps_diluted", label: "Diluted EPS", concepts: ["EarningsPerShareDiluted"], preferredUnits: ["USD/shares", "USD-per-shares"] },
  { key: "operating_cash_flow", label: "Operating cash flow", concepts: ["NetCashProvidedByUsedInOperatingActivities"], preferredUnits: ["USD"] },
  { key: "capital_expenditures", label: "Capital expenditures", concepts: ["PaymentsToAcquirePropertyPlantAndEquipment"], preferredUnits: ["USD"] },
  { key: "cash", label: "Cash and equivalents", concepts: ["CashAndCashEquivalentsAtCarryingValue", "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents"], preferredUnits: ["USD"] },
  { key: "total_assets", label: "Total assets", concepts: ["Assets"], preferredUnits: ["USD"] },
  { key: "current_assets", label: "Current assets", concepts: ["AssetsCurrent"], preferredUnits: ["USD"] },
  { key: "total_liabilities", label: "Total liabilities", concepts: ["Liabilities"], preferredUnits: ["USD"] },
  { key: "current_liabilities", label: "Current liabilities", concepts: ["LiabilitiesCurrent"], preferredUnits: ["USD"] },
  { key: "stockholders_equity", label: "Stockholders’ equity", concepts: ["StockholdersEquity", "StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest"], preferredUnits: ["USD"] },
  { key: "long_term_debt", label: "Long-term debt", concepts: ["LongTermDebtCurrent", "LongTermDebtNoncurrent"], preferredUnits: ["USD"] },
  { key: "shares_outstanding", label: "Common shares outstanding", concepts: ["CommonStockSharesOutstanding", "NumberOfSharesOutstanding", "EntityCommonStockSharesOutstanding"], preferredUnits: ["shares"] },
  { key: "diluted_shares", label: "Diluted weighted-average shares", concepts: ["WeightedAverageNumberOfDilutedSharesOutstanding"], preferredUnits: ["shares"] },
  { key: "stock_based_compensation", label: "Stock-based compensation", concepts: ["ShareBasedCompensation"], preferredUnits: ["USD"] },
];

export type CompanyFactUnit = {
  val?: number;
  start?: string;
  end?: string;
  fy?: number;
  fp?: string;
  form?: string;
  filed?: string;
  accn?: string;
  frame?: string;
};

export type SecCompanyFacts = {
  entityName?: string;
  facts?: Record<string, Record<string, {
    label?: string;
    units?: Record<string, CompanyFactUnit[]>;
  }>>;
};

export type NormalizedFilingFact = {
  metricKey: string;
  taxonomy: string;
  concept: string;
  label: string;
  value: number;
  unit: string;
  periodStart: string | null;
  periodEnd: string;
  fiscalYear: number | null;
  fiscalPeriod: string | null;
  form: string;
  filedAt: string;
  accessionNumber: string;
  sourceUrl: string;
  dimensionsJson: string;
};

function filingUrl(cik: string, accessionNumber: string) {
  const compactAccession = accessionNumber.replaceAll("-", "");
  const compactCik = String(Number(cik));
  return `https://www.sec.gov/Archives/edgar/data/${compactCik}/${compactAccession}/`;
}

function durationDays(fact: CompanyFactUnit) {
  if (!fact.start || !fact.end) return null;
  return (Date.parse(`${fact.end}T00:00:00Z`) - Date.parse(`${fact.start}T00:00:00Z`)) / 86_400_000;
}

function preferredDuration(candidate: CompanyFactUnit, current: CompanyFactUnit, fiscalPeriod: string) {
  const candidateDays = durationDays(candidate);
  const currentDays = durationDays(current);
  if (candidateDays === null || currentDays === null || candidateDays === currentDays) return false;

  // A 10-Q can expose both the standalone quarter and the cumulative YTD fact
  // with the same end date and fiscal-period tag. Quarterly cards should use
  // the standalone three-month fact when one exists. Annual cards should use
  // the full-year fact rather than a fourth-quarter fact included in a 10-K.
  return fiscalPeriod === "FY" ? candidateDays > currentDays : candidateDays < currentDays;
}

export function normalizeCompanyFacts(cik: string, payload: SecCompanyFacts): NormalizedFilingFact[] {
  const normalized: NormalizedFilingFact[] = [];

  for (const definition of secMetricDefinitions) {
    type Candidate = { taxonomy: string; concept: string; label: string; unit: string; conceptPriority: number; fact: CompanyFactUnit };
    const candidates: Candidate[] = [];

    for (const taxonomy of ["us-gaap", "ifrs-full", "dei"]) {
      const taxonomyFacts = payload.facts?.[taxonomy];
      if (!taxonomyFacts) continue;
      definition.concepts.forEach((concept, conceptPriority) => {
        const conceptFacts = taxonomyFacts[concept];
        if (!conceptFacts?.units) return;
        const unit = definition.preferredUnits.find((candidate) => conceptFacts.units?.[candidate]?.length)
          ?? Object.keys(conceptFacts.units)[0];
        if (!unit || !conceptFacts.units[unit]?.length) return;
        candidates.push(...conceptFacts.units[unit].map((fact) => ({ taxonomy, concept, label: definition.label, unit, conceptPriority, fact })));
      });
      if (candidates.length) break;
    }

    if (!candidates.length) continue;
    const latestByPeriod = new Map<string, Candidate>();
    for (const candidate of candidates) {
      const { fact } = candidate;
      if (typeof fact.val !== "number" || !Number.isFinite(fact.val) || !fact.end || !fact.filed || !fact.accn) continue;
      if (!fact.form || !["10-K", "10-K/A", "10-Q", "10-Q/A", "20-F", "20-F/A", "40-F", "40-F/A"].includes(fact.form)) continue;
      const fiscalPeriod = fact.fp ?? (fact.form.startsWith("10-K") || fact.form.startsWith("20-F") || fact.form.startsWith("40-F") ? "FY" : "Q");
      const key = `${fact.end}|${fiscalPeriod}`;
      const current = latestByPeriod.get(key);
      const newerFiling = !current || (current.fact.filed ?? "") < fact.filed;
      const sameFilingPreferredConcept = current?.fact.filed === fact.filed && candidate.conceptPriority < current.conceptPriority;
      const sameConceptPreferredDuration = current?.fact.filed === fact.filed
        && candidate.conceptPriority === current.conceptPriority
        && preferredDuration(fact, current.fact, fiscalPeriod);
      if (newerFiling || sameFilingPreferredConcept || sameConceptPreferredDuration) latestByPeriod.set(key, candidate);
    }

    const facts = [...latestByPeriod.values()]
      .sort((a, b) => (b.fact.end ?? "").localeCompare(a.fact.end ?? ""))
      .slice(0, 20);
    for (const candidate of facts) {
      const { fact } = candidate;
      normalized.push({
        metricKey: definition.key,
        taxonomy: candidate.taxonomy,
        concept: candidate.concept,
        label: candidate.label,
        value: fact.val!,
        unit: candidate.unit,
        periodStart: fact.start ?? null,
        periodEnd: fact.end!,
        fiscalYear: fact.fy ?? null,
        fiscalPeriod: fact.fp ?? (fact.form!.startsWith("10-Q") ? "Q" : "FY"),
        form: fact.form!,
        filedAt: fact.filed!,
        accessionNumber: fact.accn!,
        sourceUrl: filingUrl(cik, fact.accn!),
        dimensionsJson: JSON.stringify({ frame: fact.frame ?? null }),
      });
    }
  }

  return normalized;
}
