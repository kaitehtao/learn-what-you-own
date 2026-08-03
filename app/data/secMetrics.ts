export type SecMetricDefinition = {
  key: string;
  label: string;
  concepts: string[];
  preferredUnits: string[];
};

// Concepts are ordered from the modern, broadly used tag to common legacy
// alternatives. Importers choose the first concept that contains usable facts.
export const secMetricDefinitions: SecMetricDefinition[] = [
  { key: "revenue", label: "Revenue", concepts: ["RevenueFromContractWithCustomerExcludingAssessedTax", "Revenues", "SalesRevenueNet"], preferredUnits: ["USD"] },
  { key: "gross_profit", label: "Gross profit", concepts: ["GrossProfit"], preferredUnits: ["USD"] },
  { key: "operating_income", label: "Operating income", concepts: ["OperatingIncomeLoss"], preferredUnits: ["USD"] },
  { key: "net_income", label: "Net income", concepts: ["NetIncomeLoss", "ProfitLoss"], preferredUnits: ["USD"] },
  { key: "eps_diluted", label: "Diluted EPS", concepts: ["EarningsPerShareDiluted"], preferredUnits: ["USD/shares", "USD-per-shares"] },
  { key: "operating_cash_flow", label: "Operating cash flow", concepts: ["NetCashProvidedByUsedInOperatingActivities"], preferredUnits: ["USD"] },
  { key: "capital_expenditures", label: "Capital expenditures", concepts: ["PaymentsToAcquirePropertyPlantAndEquipment"], preferredUnits: ["USD"] },
  { key: "cash", label: "Cash and equivalents", concepts: ["CashAndCashEquivalentsAtCarryingValue", "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents"], preferredUnits: ["USD"] },
  { key: "total_assets", label: "Total assets", concepts: ["Assets"], preferredUnits: ["USD"] },
  { key: "total_liabilities", label: "Total liabilities", concepts: ["Liabilities"], preferredUnits: ["USD"] },
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

export function normalizeCompanyFacts(cik: string, payload: SecCompanyFacts): NormalizedFilingFact[] {
  const normalized: NormalizedFilingFact[] = [];

  for (const definition of secMetricDefinitions) {
    let selected: { taxonomy: string; concept: string; label: string; unit: string; facts: CompanyFactUnit[] } | null = null;

    for (const taxonomy of ["us-gaap", "ifrs-full", "dei"]) {
      const taxonomyFacts = payload.facts?.[taxonomy];
      if (!taxonomyFacts) continue;
      for (const concept of definition.concepts) {
        const conceptFacts = taxonomyFacts[concept];
        if (!conceptFacts?.units) continue;
        const unit = definition.preferredUnits.find((candidate) => conceptFacts.units?.[candidate]?.length)
          ?? Object.keys(conceptFacts.units)[0];
        if (!unit || !conceptFacts.units[unit]?.length) continue;
        selected = { taxonomy, concept, label: definition.label, unit, facts: conceptFacts.units[unit] };
        break;
      }
      if (selected) break;
    }

    if (!selected) continue;
    const latestByPeriod = new Map<string, CompanyFactUnit>();
    for (const fact of selected.facts) {
      if (typeof fact.val !== "number" || !Number.isFinite(fact.val) || !fact.end || !fact.filed || !fact.accn) continue;
      if (!fact.form || !["10-K", "10-K/A", "10-Q", "10-Q/A", "20-F", "20-F/A", "40-F", "40-F/A"].includes(fact.form)) continue;
      const fiscalPeriod = fact.fp ?? (fact.form.startsWith("10-K") || fact.form.startsWith("20-F") || fact.form.startsWith("40-F") ? "FY" : "Q");
      const key = `${fact.end}|${fiscalPeriod}`;
      const current = latestByPeriod.get(key);
      if (!current || (current.filed ?? "") < fact.filed) latestByPeriod.set(key, fact);
    }

    const facts = [...latestByPeriod.values()]
      .sort((a, b) => (b.end ?? "").localeCompare(a.end ?? ""))
      .slice(0, 20);
    for (const fact of facts) {
      normalized.push({
        metricKey: definition.key,
        taxonomy: selected.taxonomy,
        concept: selected.concept,
        label: selected.label,
        value: fact.val!,
        unit: selected.unit,
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
