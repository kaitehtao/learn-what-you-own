export type LearningGuide = {
  slug: string;
  title: string;
  searchIntent: string;
  description: string;
  readingTime: string;
  outcome: string;
  sections: Array<{
    id: string;
    title: string;
    paragraphs: string[];
    bullets?: string[];
  }>;
  checklist: string[];
  questions: Array<{ question: string; answer: string }>;
  related: Array<{ label: string; href: string }>;
};

export const learningGuides: LearningGuide[] = [
  {
    slug: "how-to-research-a-stock",
    title: "How to Research a Stock Before You Invest",
    searchIntent: "A practical, evidence-first stock research process",
    description: "A step-by-step framework for understanding a public company, testing the investment thesis, and deciding what evidence to monitor next.",
    readingTime: "12 min read",
    outcome: "You will finish with a repeatable research checklist—not a buy or sell recommendation.",
    sections: [
      {
        id: "start-with-business",
        title: "1. Start with the business, not the stock chart",
        paragraphs: [
          "Write down what the company sells, who pays it, why customers choose it, and what determines revenue and gross margin. If you cannot explain those mechanics simply, keep researching before forming a valuation opinion.",
          "Use the company’s latest annual report as the anchor. The business description, segment note, customer concentration disclosures, and risk factors usually provide a more durable foundation than a headline or social post.",
        ],
        bullets: ["Products and services", "Customer and contract types", "Revenue segments", "Pricing and recurring revenue", "Key suppliers and dependencies"],
      },
      {
        id: "follow-economics",
        title: "2. Follow the economics through the financial statements",
        paragraphs: [
          "Revenue growth matters only in context. Compare growth with gross margin, operating expenses, cash generation, debt, and changes in the share count. The goal is to see whether growth is creating or consuming owner value.",
          "Use at least three comparable annual periods and the latest interim period. Note whether acquisitions, divestitures, accounting changes, or currency effects make the comparison less meaningful.",
        ],
        bullets: ["Revenue and organic growth", "Gross and operating margins", "Free cash flow", "Cash, debt, and maturities", "Diluted shares outstanding"],
      },
      {
        id: "build-two-sided-thesis",
        title: "3. Build the bull case and bear case from the same evidence",
        paragraphs: [
          "A useful thesis is falsifiable. State what must go right, what the market may be underestimating, and which measurable developments would weaken or invalidate the idea.",
          "The bear case should not be a disclaimer appended to a preferred conclusion. Give it the same evidence standard, time horizon, and attention as the bull case.",
        ],
        bullets: ["Three evidence-backed reasons the business could improve", "Three mechanisms that could impair value", "Leading indicators for each side", "A clear thesis-breaker"],
      },
      {
        id: "compare-and-value",
        title: "4. Compare the company with relevant alternatives",
        paragraphs: [
          "Choose peers based on business economics, customers, and capital intensity—not simply sector labels. Compare enterprise value to revenue and EBITDA only when the underlying definitions and business models are reasonably comparable.",
          "Balance-sheet differences matter. A lower valuation multiple may reflect more debt, weaker margins, slower growth, dilution, or a structurally inferior business.",
        ],
      },
      {
        id: "create-monitoring-plan",
        title: "5. Turn the thesis into an owner monitoring plan",
        paragraphs: [
          "Record the few metrics, filings, milestones, and management commitments that will tell you whether the thesis is progressing. Update the record after every earnings release rather than rebuilding the story from memory.",
          "Separate facts, management statements, estimates, opinions, and your own inferences. Attach a source to every material factual claim.",
        ],
      },
    ],
    checklist: ["Read the latest 10-K and 10-Q", "Explain the business model in five sentences", "Record five financial drivers", "Write balanced bull and bear cases", "Compare valuation and balance sheets", "Define thesis breakers and monitoring dates"],
    questions: [
      { question: "How long should stock research take?", answer: "There is no reliable minimum. A first pass can identify obvious risks quickly, but a durable ownership decision usually requires reading primary filings, comparing periods, and testing competing explanations." },
      { question: "What is the best source for company research?", answer: "Start with primary sources: SEC filings, investor-relations materials, earnings exhibits, and direct management statements. Use independent reporting and expert research to test—not replace—that foundation." },
      { question: "Does this process tell me whether to buy?", answer: "No. It helps organize evidence and uncertainty. Suitability, position size, taxes, and personal risk tolerance require separate judgment and may warrant professional advice." },
    ],
    related: [{ label: "Browse company dossiers", href: "/companies" }, { label: "Build a comparable-company table", href: "/comps" }, { label: "Open the research notebook", href: "/notebook" }],
  },
  {
    slug: "how-to-read-a-10-k",
    title: "How to Read a 10-K Like a Business Owner",
    searchIntent: "Find the most decision-useful parts of an annual report",
    description: "A practical route through a 10-K: business model, risks, financial statements, footnotes, controls, and the questions an owner should carry forward.",
    readingTime: "10 min read",
    outcome: "You will know where to look first and how to turn filing disclosures into owner questions.",
    sections: [
      { id: "orientation", title: "1. Orient yourself before reading line by line", paragraphs: ["Confirm the reporting period, fiscal year end, legal issuer, and whether the company changed segments or accounting policies. Scan the table of contents and exhibits so you understand the document’s structure."], bullets: ["Business and segment description", "Risk factors", "Management discussion and analysis", "Audited financial statements", "Footnotes and exhibits"] },
      { id: "business-model", title: "2. Reconstruct the business model", paragraphs: ["Use Items 1 and 7 together. Item 1 explains what the company says it does; management discussion shows how those activities translated into reported results.", "Record customer concentration, contract structure, seasonality, geography, regulatory dependencies, and the variables management says drive performance."] },
      { id: "statements", title: "3. Connect the three financial statements", paragraphs: ["Trace net income into operating cash flow, then reconcile capital spending and financing. Look for large non-cash adjustments, working-capital swings, acquisitions, stock compensation, and debt-funded distributions."], bullets: ["Income statement: growth and profitability", "Balance sheet: resilience and obligations", "Cash-flow statement: conversion and capital needs", "Equity statement: dilution and capital returns"] },
      { id: "footnotes", title: "4. Read the footnotes where the economic detail lives", paragraphs: ["The footnotes explain revenue recognition, debt maturities, leases, legal contingencies, pensions, stock compensation, acquisitions, taxes, and segment results. Search the filing for terms tied to the thesis rather than treating the footnotes as optional."] },
      { id: "compare", title: "5. Compare claims with prior filings", paragraphs: ["A single 10-K is a snapshot. Compare management’s prior commitments, risk language, segment definitions, and key estimates. Material deletions can matter as much as new wording."] },
    ],
    checklist: ["Confirm issuer and fiscal period", "Map segments and customers", "Reconcile profit to cash flow", "Review debt and share-count changes", "Search material footnotes", "Compare with the prior 10-K"],
    questions: [
      { question: "Where can I find a company’s 10-K?", answer: "Use the SEC’s EDGAR company search or the filing links in a LearnWhatYouOwn dossier. Verify the legal issuer and filing date before relying on the document." },
      { question: "Should I read risk factors first?", answer: "They are essential, but not sufficient. Read them alongside the business model, financial statements, and footnotes so you can judge probability and economic impact." },
    ],
    related: [{ label: "Search SEC EDGAR", href: "https://www.sec.gov/edgar/search/" }, { label: "Browse evidence-linked dossiers", href: "/companies" }, { label: "See dossier coverage", href: "/research/batches" }],
  },
  {
    slug: "how-to-evaluate-insider-trading",
    title: "How to Evaluate Insider Buying and Selling",
    searchIntent: "Interpret SEC Form 4 activity without losing context",
    description: "Learn what insider transactions can—and cannot—tell owners, how to read Form 4, and how to distinguish purchases, grants, option exercises, and sales.",
    readingTime: "9 min read",
    outcome: "You will be able to classify insider activity before deciding whether it is meaningful.",
    sections: [
      { id: "forms", title: "1. Start with the SEC filing", paragraphs: ["Forms 3, 4, and 5 report beneficial ownership and changes for directors, officers, and certain large holders. Read the transaction codes, footnotes, ownership type, and post-transaction holdings—not only a summary headline."] },
      { id: "classify", title: "2. Classify the transaction correctly", paragraphs: ["An open-market purchase is economically different from an equity grant, option exercise, tax withholding, gift, or automatic sale. Footnotes may describe a pre-arranged Rule 10b5-1 plan or an indirect holding."], bullets: ["Open-market purchase", "Open-market sale", "Award or grant", "Option exercise", "Tax withholding", "Gift or transfer"] },
      { id: "context", title: "3. Measure the transaction in context", paragraphs: ["Compare the value with the insider’s existing holdings, compensation, role, and prior activity. A cluster of discretionary purchases can carry different information than one small transaction, but no filing proves future stock performance."] },
      { id: "ownership", title: "4. Separate transaction activity from ownership concentration", paragraphs: ["Form 4 activity shows changes, while proxy beneficial-ownership tables and Schedules 13D or 13G can better describe large positions. Institutional Form 13F reporting has different scope and timing and should not be treated as a real-time cap table."] },
      { id: "monitor", title: "5. Use activity as a research prompt", paragraphs: ["Ask what changed in the business, valuation, compensation plan, or liquidity needs around the filing date. Insider activity is one input in a broader evidence set, not a standalone investment thesis."] },
    ],
    checklist: ["Open the original SEC form", "Read codes and footnotes", "Identify direct or indirect ownership", "Compare with total holdings", "Check planned-sale disclosures", "Relate activity to business evidence"],
    questions: [
      { question: "Does insider buying mean a stock will rise?", answer: "No. It can signal conviction, but insiders can be early or wrong. Transaction size, prior holdings, timing, and business fundamentals all matter." },
      { question: "Why do some insider sales look automatic?", answer: "Some sales occur under pre-arranged plans, to cover taxes, or after option exercises. The Form 4 transaction codes and footnotes help explain the mechanism." },
    ],
    related: [{ label: "Explore insider buys and sells", href: "/insider-activity" }, { label: "Browse company ownership panels", href: "/companies" }, { label: "SEC Forms 3, 4 and 5", href: "https://www.sec.gov/edgar/searchedgar/insidertransactions.html" }],
  },
  {
    slug: "how-to-compare-stocks",
    title: "How to Compare Stocks With a Useful Comp Table",
    searchIntent: "Build comparable-company analysis that explains differences",
    description: "A guide to choosing relevant peers and comparing valuation, growth, margins, cash, debt, and business quality without relying on one multiple.",
    readingTime: "9 min read",
    outcome: "You will be able to build a comp table that explains why valuation differences may exist.",
    sections: [
      { id: "peer-set", title: "1. Choose peers by economics, not labels", paragraphs: ["The best comparables sell to similar customers, earn money in similar ways, and face similar capital intensity. Sector membership alone can group businesses with very different margins, cyclicality, and balance sheets."] },
      { id: "enterprise-equity", title: "2. Match the numerator and denominator", paragraphs: ["Enterprise-value multiples compare the operating business before financing; equity-value multiples belong with measures available to common shareholders. Avoid mixing market capitalization with EBITDA or enterprise value with earnings per share."] },
      { id: "metrics", title: "3. Put valuation beside operating evidence", paragraphs: ["Show growth, gross and operating margins, free-cash-flow conversion, net cash or debt, and share-count trends beside each multiple. A multiple without its economic drivers is not a conclusion."], bullets: ["Market capitalization and enterprise value", "Revenue and EBITDA multiples", "Earnings and free-cash-flow multiples", "Growth and margins", "Cash, debt, and dilution"] },
      { id: "normalize", title: "4. Normalize carefully", paragraphs: ["Check fiscal periods, one-time charges, acquisition effects, stock compensation, and non-GAAP definitions. When the underlying data is not comparable, label the limitation instead of manufacturing precision."] },
      { id: "interpret", title: "5. Explain the spread", paragraphs: ["Ask which differences are supported by durability, growth, returns on capital, balance-sheet risk, governance, or cyclicality. A good comp analysis turns the valuation spread into testable questions."] },
    ],
    checklist: ["Define the peer-selection rule", "Use matching valuation definitions", "Align fiscal periods", "Display operating drivers", "Flag non-comparable data", "Explain—not merely rank—the multiples"],
    questions: [
      { question: "Which valuation multiple is best?", answer: "There is no universal best multiple. The right measure depends on business maturity, capital structure, profitability, and the reliability of the denominator." },
      { question: "Can private companies be included?", answer: "Yes, when credible valuation and operating data are available, but private-company figures are often less current or comparable and should be clearly labeled." },
    ],
    related: [{ label: "Build your own comp table", href: "/comps" }, { label: "Browse company dossiers", href: "/companies" }, { label: "Research S&P 500 companies", href: "/research/batches" }],
  },
  {
    slug: "how-to-understand-stock-ownership",
    title: "How to Understand Who Owns a Public Company",
    searchIntent: "Read insider, institutional, retail, and float data correctly",
    description: "Understand shares outstanding, public float, insider ownership, institutional filings, beneficial owners, and why different ownership totals may not reconcile.",
    readingTime: "10 min read",
    outcome: "You will know which filing answers which ownership question—and where estimates remain uncertain.",
    sections: [
      { id: "definitions", title: "1. Define the ownership measure", paragraphs: ["Shares outstanding, diluted weighted-average shares, public float, beneficial ownership, and tradable float answer different questions. Record the definition and measurement date beside every figure."] },
      { id: "proxy", title: "2. Use the proxy for directors, officers, and large holders", paragraphs: ["The annual proxy statement commonly contains a beneficial-ownership table for directors, named executives, and holders known to own more than five percent. Review the footnotes for voting arrangements, indirect holdings, options, and classes of stock."] },
      { id: "large-holders", title: "3. Use Schedules 13D and 13G for large beneficial owners", paragraphs: ["These filings can identify holders that cross reporting thresholds and may explain intent or passive status. Amendments matter because positions and intentions change."] },
      { id: "institutions", title: "4. Treat Form 13F as delayed position reporting", paragraphs: ["Form 13F covers specified securities held by qualifying institutional investment managers. It is periodic, delayed, and not a complete real-time ownership ledger. Aggregated totals can double count or omit exposures depending on methodology."] },
      { id: "retail", title: "5. Label estimated retail ownership honestly", paragraphs: ["There is generally no comprehensive SEC filing that directly reports every retail holder. Retail ownership is usually estimated by subtracting disclosed categories or using licensed datasets, and the result should carry a method, date, and limitation." ] },
    ],
    checklist: ["Record the share-count definition and date", "Read the latest proxy ownership table", "Check 13D and 13G amendments", "Understand the 13F reporting lag", "Separate public float from shares outstanding", "Label retail ownership as an estimate"],
    questions: [
      { question: "Do 13F filings list every institutional shareholder?", answer: "No. They cover qualifying managers and specified reportable securities, are filed after quarter end, and do not create a complete real-time cap table." },
      { question: "Where can I find founder ownership?", answer: "Start with the latest proxy beneficial-ownership table and its footnotes, then review relevant 13D or 13G filings and insider forms for changes." },
    ],
    related: [{ label: "Browse company ownership dossiers", href: "/companies" }, { label: "Explore SEC insider activity", href: "/insider-activity" }, { label: "SEC company filings", href: "https://www.sec.gov/edgar/search/" }],
  },
];

export const guideBySlug = new Map(learningGuides.map((guide) => [guide.slug, guide]));
