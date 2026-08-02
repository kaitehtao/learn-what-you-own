import type { FeaturedDossier } from "./featuredDossiers";

type DossierUpgrade = Partial<FeaturedDossier>;

const sec = (cik: string) => `https://www.sec.gov/edgar/browse/?CIK=${cik}&owner=exclude`;

/**
 * Flagship-depth overlays for the ten homepage companies that originally had
 * concise prototype coverage.  AMC and CRWV already carry bespoke deep-dive
 * records in featuredDossiers.ts and therefore do not need an overlay here.
 *
 * Figures are point-in-time observations from the linked issuer or SEC source.
 * The live market-data panel remains the source for changing prices and market
 * values; comparables deliberately avoid hard-coding fast-decaying valuations.
 */
export const flagshipDossierUpgrades: Record<string, DossierUpgrade> = {
  NVDA: {
    reviewed: "August 1, 2026",
    completeness: 96,
    newsroomUrl: "https://nvidianews.nvidia.com/news/latest",
    financialDrivers: [
      { label: "Q1 FY27 REVENUE", value: "$81.6B · +85%", detail: "Official May 2026 results; judge growth against customer concentration, supply, and the durability of AI infrastructure spending" },
      { label: "DATA CENTER", value: "$75.2B · +92%", detail: "Compute, networking, systems, and software adoption remain the dominant value driver" },
      { label: "GROSS MARGIN", value: "75.0% non-GAAP", detail: "Track mix, product transitions, export controls, supply costs, and competitive pricing" },
      { label: "Q2 FY27 OUTLOOK", value: "$91B ±2%", detail: "Company guidance assumed no Data Center compute revenue from China" },
    ],
    monitor: [
      { title: "Rubin transition and inference economics", text: "Measure time-to-volume, performance per dollar, networking attach, and software monetization rather than relying on benchmark leadership alone.", impact: "BULL CASE" },
      { title: "Hyperscaler spending and custom silicon", text: "Separate additive accelerator programs from workloads that permanently move away from NVIDIA's platform.", impact: "BEAR CASE" },
      { title: "Supply and export controls", text: "Track foundry, advanced packaging, memory, optics, system availability, and the revenue pool made inaccessible by regulation.", impact: "NEUTRAL" },
    ],
    questions: [
      "What portion of current demand represents recurring production inference rather than one-time capacity buildout?",
      "How much of the platform's economics comes from networking and software versus accelerators?",
      "Where does custom silicon become a substitute rather than a complement?",
      "Can NVIDIA preserve full-stack returns as customers gain purchasing scale?",
    ],
    comparables: [
      { name: "Advanced Micro Devices", ticker: "AMD", ownership: "Public", relationship: "Direct accelerator and CPU competitor", valuation: "Use live market value and EV/revenue above", financialStatus: "Profitable semiconductor platform investing to expand accelerator software and systems share.", sourceUrl: "https://ir.amd.com/" },
      { name: "Broadcom", ticker: "AVGO", ownership: "Public", relationship: "Networking and custom-accelerator enabler", valuation: "Compare semiconductor growth, margins, and free-cash-flow yield", financialStatus: "Diversified semiconductor and infrastructure-software company with material custom-silicon exposure.", sourceUrl: "https://investors.broadcom.com/" },
      { name: "Intel", ticker: "INTC", ownership: "Public", relationship: "CPU, accelerator, foundry, and platform competitor", valuation: "Asset-heavy turnaround; earnings multiples need normalization", financialStatus: "Large revenue base with substantial manufacturing investment and restructuring risk.", sourceUrl: "https://www.intc.com/" },
      { name: "Hyperscaler custom silicon", ticker: "—", ownership: "Private", relationship: "Customer-designed substitutes including internal AI accelerators", valuation: "No standalone valuation", financialStatus: "Economics sit inside large cloud platforms; adoption must be measured by workload share, not chip announcements.", sourceUrl: "https://www.sec.gov/edgar/search/" },
    ],
    sources: [
      { title: "NVIDIA SEC filing library", meta: "SEC EDGAR · Primary filings", href: sec("1045810"), excerpt: "NVIDIA filings describe its platform markets, customer concentration, manufacturing and supply dependencies, export controls, competition, cash generation, and capital returns." },
      { title: "NVIDIA Q1 Fiscal 2027 Results", meta: "Company earnings release · May 20, 2026", href: "https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-Announces-Financial-Results-for-First-Quarter-Fiscal-2027/default.aspx", excerpt: "The official release reports revenue, Data Center results, margins, outlook, platform announcements, and the company's treatment of stock-based compensation in non-GAAP measures." },
      { title: "NVIDIA Investor Relations", meta: "Company primary materials", href: "https://investor.nvidia.com/", excerpt: "Official results, CFO commentary, presentations, SEC filings, events, and governance information." },
      { title: "NVIDIA SEC filing detail", meta: "Company-hosted filing index · Q1 FY2027 Form 10-Q", href: "https://investor.nvidia.com/financial-info/sec-filings/sec-filings-details/default.aspx?FilingId=19467022", excerpt: "The quarterly filing provides the accounting, concentration, liquidity, risk, and segment evidence behind the earnings release." },
    ],
  },
  AAPL: {
    reviewed: "August 1, 2026",
    completeness: 96,
    newsroomUrl: "https://www.apple.com/newsroom/topics/company-news/",
    financialDrivers: [
      { label: "Q2 FY26 REVENUE", value: "$111.2B · +17%", detail: "March-quarter revenue from products and services; verify category and geography in the linked statements" },
      { label: "SERVICES", value: "$31.0B", detail: "Recurring and transaction revenue with materially different regulation and margin exposure than hardware" },
      { label: "OPERATING CASH FLOW", value: ">$28B", detail: "Funds product investment, supply commitments, dividends, and repurchases" },
      { label: "CAPITAL RETURNS", value: "$100B authorization", detail: "Additional repurchase authorization announced with the April 2026 results; per-share benefit depends on valuation" },
    ],
    monitor: [
      { title: "Installed-base monetization", text: "Track active devices, paid accounts, services mix, churn, and regulatory changes—not services revenue in isolation.", impact: "BULL CASE" },
      { title: "Leadership and product cadence", text: "Evaluate execution through leadership transitions, device differentiation, silicon roadmaps, AI features, and upgrade behavior.", impact: "NEUTRAL" },
      { title: "China demand and supply concentration", text: "Separate regional consumer demand from manufacturing, supplier, trade, and geopolitical dependencies.", impact: "BEAR CASE" },
    ],
    questions: [
      "Which products can become economically material beyond iPhone?",
      "How much services profit depends on distribution terms regulators may change?",
      "Will on-device AI create a measurable replacement cycle or mainly defend retention?",
      "Do repurchases create value at the market price after funding core innovation?",
    ],
    comparables: [
      { name: "Samsung Electronics", ticker: "005930.KS", ownership: "Public", relationship: "Premium device, component, and ecosystem competitor", valuation: "Compare device mix and semiconductor exposure separately", financialStatus: "Diversified electronics and semiconductor group; not a clean consolidated multiple peer.", sourceUrl: "https://www.samsung.com/global/ir/" },
      { name: "Alphabet", ticker: "GOOGL", ownership: "Public", relationship: "Mobile platform, services, AI, and distribution competitor", valuation: "Compare services economics and platform risk, not hardware revenue", financialStatus: "Highly profitable advertising and cloud platform with Android distribution leverage.", sourceUrl: "https://abc.xyz/investor/" },
      { name: "Microsoft", ticker: "MSFT", ownership: "Public", relationship: "Operating-system, device, cloud, productivity, and AI competitor", valuation: "Compare recurring revenue, margins, and free-cash-flow durability", financialStatus: "Diversified, highly profitable enterprise and consumer software platform.", sourceUrl: "https://www.microsoft.com/en-us/Investor" },
      { name: "Huawei", ticker: "—", ownership: "Private", relationship: "Device, ecosystem, and infrastructure competitor, especially in China", valuation: "No public equity valuation", financialStatus: "Private employee-owned operating company with public annual reports but no traded equity.", sourceUrl: "https://www.huawei.com/en/annual-report" },
    ],
    sources: [
      { title: "Apple SEC filing library", meta: "SEC EDGAR · Primary filings", href: sec("320193"), excerpt: "Apple filings describe products, services, geographic and channel exposure, supply-chain commitments, platform regulation, cash, debt, repurchases, and risk factors." },
      { title: "Apple Fiscal Q2 2026 Results", meta: "Company press release · April 30, 2026", href: "https://www.apple.com/newsroom/2026/04/apple-reports-second-quarter-results/", excerpt: "The official release reports March-quarter revenue, earnings per share, cash flow, dividend, and additional repurchase authorization." },
      { title: "Apple Q2 FY2026 Financial Statements", meta: "Company financial statements", href: "https://www.apple.com/newsroom/pdfs/fy2026q2/FY26_Q2_Consolidated_Financial_Statements.pdf", excerpt: "The statements provide product, services, and geographic sales plus income, balance-sheet, and cash-flow detail." },
      { title: "Apple Investor Relations", meta: "Company primary materials", href: "https://investor.apple.com/", excerpt: "Official earnings materials, SEC filings, governance documents, shareholder information, and events." },
    ],
  },
  AMZN: {
    reviewed: "August 1, 2026",
    completeness: 96,
    newsroomUrl: "https://ir.aboutamazon.com/news-release/news-release-details/default.aspx",
    financialDrivers: [
      { label: "Q1 REVENUE", value: "$181.5B · +17%", detail: "North America, International, and AWS must be separated because their economics and capital needs differ" },
      { label: "AWS", value: "$37.6B · +28%", detail: "Cloud usage, capacity, custom silicon, AI services, and operating margin" },
      { label: "OPERATING INCOME", value: "$23.9B", detail: "Retail productivity and AWS mix drove improvement; owner focus remains conversion to durable free cash flow" },
      { label: "AI INFRASTRUCTURE", value: ">$20B chip run-rate", detail: "Company-stated annual run rate for Graviton, Trainium, and Nitro; track utilization and returns on data-center investment" },
    ],
    monitor: [
      { title: "AWS growth versus infrastructure returns", text: "Compare cloud growth and operating income with capital expenditures, useful capacity, customer commitments, and asset lives.", impact: "BULL CASE" },
      { title: "Retail cost-to-serve", text: "Track delivery speed, inventory placement, regionalization, labor, transportation, and third-party seller economics.", impact: "NEUTRAL" },
      { title: "Custom silicon adoption", text: "Measure Trainium and Graviton workload penetration without assuming every deployed chip displaces an external accelerator dollar-for-dollar.", impact: "NEUTRAL" },
    ],
    questions: [
      "What cash return will the current AI infrastructure cycle earn?",
      "How much retail margin improvement is structural rather than mix or timing?",
      "Can advertising expand without degrading marketplace trust?",
      "Where does Amazon Leo become a material standalone profit pool?",
    ],
    comparables: [
      { name: "Microsoft", ticker: "MSFT", ownership: "Public", relationship: "Primary enterprise cloud and AI platform competitor", valuation: "Compare cloud growth, margin, and capital intensity", financialStatus: "Highly profitable software and cloud platform with a larger recurring software mix.", sourceUrl: "https://www.microsoft.com/en-us/Investor" },
      { name: "Alphabet", ticker: "GOOGL", ownership: "Public", relationship: "Cloud, advertising, AI, devices, and commerce-adjacent competitor", valuation: "Compare cloud profitability and advertising economics", financialStatus: "Advertising-funded platform with a profitable cloud segment and large AI investment program.", sourceUrl: "https://abc.xyz/investor/" },
      { name: "Walmart", ticker: "WMT", ownership: "Public", relationship: "Scaled retail, marketplace, advertising, and fulfillment competitor", valuation: "Retail multiples require margin and working-capital context", financialStatus: "Profitable global retailer with stores that also serve as fulfillment infrastructure.", sourceUrl: "https://stock.walmart.com/" },
      { name: "Shopify", ticker: "SHOP", ownership: "Public", relationship: "Merchant software, payments, and commerce ecosystem competitor", valuation: "Compare gross profit and free-cash-flow growth rather than GMV alone", financialStatus: "Asset-lighter merchant platform with transaction and subscription economics.", sourceUrl: "https://investors.shopify.com/" },
    ],
    sources: [
      { title: "Amazon SEC filing library", meta: "SEC EDGAR · Primary filings", href: sec("1018724"), excerpt: "Amazon filings report North America, International, and AWS results and disclose customers, competition, infrastructure, fulfillment, leases, commitments, regulation, and risk." },
      { title: "Amazon First-Quarter 2026 Results", meta: "Company earnings release · April 29, 2026", href: "https://ir.aboutamazon.com/news-release/news-release-details/2026/Amazon-com-Announces-First-Quarter-Results/", excerpt: "The official release reports segment sales and operating income, cash flow, guidance, and management's operating highlights." },
      { title: "Amazon Quarterly Results", meta: "Company financial archive", href: "https://ir.aboutamazon.com/quarterly-results/default.aspx", excerpt: "Official earnings releases, slides, webcasts, and quarterly filing links across reporting periods." },
      { title: "Amazon Investor Relations", meta: "Company primary materials", href: "https://ir.aboutamazon.com/", excerpt: "Annual reports, proxies, shareholder letters, SEC filings, press releases, governance information, and events." },
    ],
  },
  TSLA: {
    reviewed: "August 1, 2026",
    completeness: 95,
    newsroomUrl: "https://ir.tesla.com/press",
    financialDrivers: [
      { label: "Q2 DELIVERIES", value: "480,126", detail: "Vehicles delivered in Q2 2026; pricing, mix, leasing, incentives, and receivables determine the financial result" },
      { label: "ENERGY STORAGE", value: "13.5 GWh", detail: "Q2 deployments; monitor revenue recognition, product mix, manufacturing cost, and gross profit" },
      { label: "AUTOMOTIVE MARGIN", value: "Core earnings test", detail: "Separate regulatory credits, pricing, mix, warranty, factories, and utilization" },
      { label: "AI & AUTONOMY", value: "Milestones before value", detail: "Judge paid adoption, safety performance, regulation, unit economics, and capital required—not demonstrations alone" },
    ],
    monitor: [
      { title: "Delivery growth and price realization", text: "Track orders, deliveries, inventory, average selling price, incentives, leasing, and regional mix together.", impact: "NEUTRAL" },
      { title: "Energy gross profit", text: "Measure whether storage deployment growth translates into recurring services and durable cash returns.", impact: "BULL CASE" },
      { title: "Autonomy evidence", text: "Require measurable paid usage, safety data, regulatory permission, insurance economics, and capital efficiency before assigning platform value.", impact: "NEUTRAL" },
    ],
    questions: [
      "What normalized automotive margin is sustainable without regulatory credits?",
      "How much capital is required before autonomy becomes a material profit contributor?",
      "Can energy become a comparably durable earnings engine?",
      "How should owners value governance and key-person concentration?",
    ],
    comparables: [
      { name: "BYD", ticker: "1211.HK", ownership: "Public", relationship: "Global electric-vehicle and battery competitor", valuation: "Compare auto and battery economics separately", financialStatus: "Profitable, vertically integrated manufacturer with broad price-point and geographic exposure.", sourceUrl: "https://www.bydglobal.com/en/Investor.html" },
      { name: "General Motors", ticker: "GM", ownership: "Public", relationship: "Scaled vehicle, financing, software, and autonomy competitor", valuation: "Legacy auto multiples reflect cyclicality and capital intensity", financialStatus: "Profitable global automaker funding EV, battery, software, and autonomy programs.", sourceUrl: "https://investor.gm.com/" },
      { name: "Rivian", ticker: "RIVN", ownership: "Public", relationship: "EV platform and direct-sales competitor", valuation: "Use EV/revenue and liquidity runway with caution", financialStatus: "Scaling manufacturer whose valuation depends on gross-margin progress, capital needs, and future platforms.", sourceUrl: "https://rivian.com/investors" },
      { name: "Waymo", ticker: "—", ownership: "Private", relationship: "Autonomous ride-hailing competitor owned by Alphabet", valuation: "No standalone public valuation", financialStatus: "Funded within Alphabet; operational footprint and paid rides matter more than an unavailable standalone multiple.", sourceUrl: "https://abc.xyz/investor/" },
    ],
    sources: [
      { title: "Tesla SEC filing library", meta: "SEC EDGAR · Primary filings", href: sec("1318605"), excerpt: "Tesla filings disclose automotive, energy, services, credit, leasing, manufacturing, cash, debt, legal, governance, and risk information." },
      { title: "Tesla Q2 2026 Deliveries and Deployments", meta: "Company operational release · July 2, 2026", href: "https://ir.tesla.com/press-release/tesla-second-quarter-2026-production-deliveries-and-deployments", excerpt: "The release reports vehicle production and deliveries plus energy-storage deployments, while warning that these measures alone do not establish quarterly financial performance." },
      { title: "Tesla 2026 Quarterly Disclosures", meta: "Company earnings and filing hub", href: "https://ir.tesla.com/", excerpt: "Official production releases, shareholder decks, webcasts, SEC filings, and consensus information by quarter." },
      { title: "Tesla SEC Filings", meta: "Company-hosted SEC index", href: "https://ir.tesla.com/sec-filings", excerpt: "Searchable annual, quarterly, current, ownership, and other filings with direct HTML and PDF links." },
    ],
  },
  PLTR: {
    reviewed: "August 1, 2026",
    completeness: 96,
    newsroomUrl: "https://investors.palantir.com/news",
    financialDrivers: [
      { label: "Q1 REVENUE", value: "$1.6B · +85%", detail: "Growth across U.S. commercial and government; contract timing and termination provisions still matter" },
      { label: "GROSS MARGIN", value: "87% GAAP", detail: "Software economics before stock-based compensation, sales investment, and infrastructure requirements" },
      { label: "OPERATING INCOME", value: "$754M GAAP", detail: "Compare GAAP with adjusted results and monitor stock-based compensation plus payroll taxes" },
      { label: "U.S. REVENUE", value: "+104%", detail: "Company-reported Q1 growth; test customer count, deal size, remaining obligations, and renewal quality" },
    ],
    monitor: [
      { title: "Commercial cohort durability", text: "Track customer growth, contract value, remaining deal value, expansion, renewal, and revenue concentration.", impact: "BULL CASE" },
      { title: "Government procurement", text: "Measure program wins and expansion against budget timing, protests, competition, and concentration.", impact: "NEUTRAL" },
      { title: "Per-share conversion", text: "Reconcile adjusted profitability to GAAP cash generation and fully diluted share count.", impact: "BEAR CASE" },
    ],
    questions: [
      "How repeatable is current U.S. commercial growth once early AI deployments mature?",
      "What portion of bookings can be terminated for convenience or depends on option periods?",
      "Can distribution scale without proportionate deployment and sales labor?",
      "Does per-share value grow after stock-based compensation and dilution?",
    ],
    comparables: [
      { name: "Snowflake", ticker: "SNOW", ownership: "Public", relationship: "Enterprise data and AI platform competitor", valuation: "Compare product revenue, remaining obligations, and free cash flow", financialStatus: "High-growth, subscription and consumption software platform with different deployment economics.", sourceUrl: "https://investors.snowflake.com/" },
      { name: "Datadog", ticker: "DDOG", ownership: "Public", relationship: "Cloud observability and enterprise software comparable", valuation: "Compare growth, margin, retention, and cash conversion", financialStatus: "Profitable-at-scale cloud software business with a broadening platform.", sourceUrl: "https://investors.datadoghq.com/" },
      { name: "C3.ai", ticker: "AI", ownership: "Public", relationship: "Enterprise AI application competitor", valuation: "Revenue multiple must be read with losses and cash", financialStatus: "Smaller enterprise-AI vendor still working toward durable profitability.", sourceUrl: "https://ir.c3.ai/" },
      { name: "Anduril", ticker: "—", ownership: "Private", relationship: "Defense software, autonomy, and systems competitor", valuation: "Private; no continuously observable public value", financialStatus: "Venture-backed defense technology company; disclosures are less complete than SEC reporting.", sourceUrl: "https://www.anduril.com/" },
    ],
    sources: [
      { title: "Palantir SEC filing library", meta: "SEC EDGAR · Primary filings", href: sec("1321655"), excerpt: "Palantir filings describe its platforms, customer contracts, government and commercial exposure, remaining deal value, stock-based compensation, cash, governance, competition, and risks." },
      { title: "Palantir Q1 2026 Results", meta: "Company earnings release · May 4, 2026", href: "https://investors.palantir.com/news-details/2026/Palantir-Reports-Q1-2026-U-S--Revenue-Growth-of-104-YY-and-Revenue-Growth-of-85-YY-Raises-FY-2026-Revenue-Guidance-to-71-YY-Growth-and-U-S--Comm-Revenue-Guidance-to-120-YY-Crushing-Consensus-Expectations/", excerpt: "The official release summarizes first-quarter growth, U.S. revenue trends, and updated company guidance." },
      { title: "Palantir Q1 2026 Form 10-Q", meta: "Company-hosted SEC filing", href: "https://investors.palantir.com/files/2026%20Q1%20PLTR%2010-Q.pdf", excerpt: "The filing reports revenue, margins, operating income, cash flow, contract terms, seasonality, share count, contingencies, and risk factors." },
      { title: "Palantir Earnings Events", meta: "Company primary materials", href: "https://investors.palantir.com/events.html", excerpt: "Official earnings releases, shareholder letters, presentations, webcasts, and annual or quarterly reports." },
    ],
  },
  RKLB: {
    reviewed: "August 1, 2026",
    completeness: 96,
    newsroomUrl: "https://investors.rocketlabcorp.com/news-releases",
    financialDrivers: [
      { label: "Q1 REVENUE", value: "$200.3M · +63.5%", detail: "Launch Services and Space Systems mix; acquisitions and program timing affect comparability" },
      { label: "GAAP GROSS MARGIN", value: "38.2%", detail: "Track launch cadence, component mix, contract estimates, and development cost treatment" },
      { label: "BACKLOG", value: "$2.2B", detail: "Conversion depends on mission schedules, customer funding, contract terms, and execution" },
      { label: "LIQUIDITY", value: ">$2B access", detail: "Company-stated access after financing; weigh against Neutron, acquisitions, facilities, and ongoing losses" },
    ],
    monitor: [
      { title: "Neutron technical milestones", text: "Track testing, pad and factory readiness, regulatory approvals, schedule, contracted launches, and remaining capital—not target dates alone.", impact: "BULL CASE" },
      { title: "Electron and HASTE cadence", text: "Measure successful launches, average revenue, manifest quality, range availability, and mission reliability.", impact: "NEUTRAL" },
      { title: "Acquisition integration", text: "Test whether acquired components and spacecraft capabilities improve organic growth, margin, and strategic win rates.", impact: "BEAR CASE" },
    ],
    questions: [
      "What capital remains before Neutron reaches reliable commercial cadence?",
      "How much backlog is funded, firm, and scheduled versus option value?",
      "Can Space Systems sustain margin as program mix changes?",
      "Do acquisitions increase per-share value after financing and integration costs?",
    ],
    comparables: [
      { name: "SpaceX", ticker: "—", ownership: "Private", relationship: "Launch, satellite, spacecraft, and government-program competitor", valuation: "Private; transaction values are intermittent and not like-for-like", financialStatus: "Scaled private operator with launch and Starlink economics that are not separately disclosed through SEC filings.", sourceUrl: "https://www.spacex.com/" },
      { name: "Northrop Grumman", ticker: "NOC", ownership: "Public", relationship: "Space systems, launch, propulsion, and defense comparable", valuation: "Compare program mix, margins, backlog, and cash conversion", financialStatus: "Large profitable defense prime with mature government programs.", sourceUrl: "https://investor.northropgrumman.com/" },
      { name: "Lockheed Martin", ticker: "LMT", ownership: "Public", relationship: "Space, missiles, national-security, and systems competitor", valuation: "Mature-prime multiples are not appropriate for Neutron option value", financialStatus: "Large cash-generative defense prime with long-cycle funded backlog.", sourceUrl: "https://investors.lockheedmartin.com/" },
      { name: "L3Harris", ticker: "LHX", ownership: "Public", relationship: "Space payload, propulsion, communications, and defense comparable", valuation: "Compare organic growth, margin, leverage, and cash conversion", financialStatus: "Diversified defense technology supplier integrating major acquired assets.", sourceUrl: "https://www.l3harris.com/investors" },
    ],
    sources: [
      { title: "Rocket Lab SEC filing library", meta: "SEC EDGAR · Primary filings", href: sec("1819994"), excerpt: "Rocket Lab filings describe launch and space systems revenue, contracts, backlog, liquidity, acquisitions, development spending, competition, and mission risk." },
      { title: "Rocket Lab Q1 2026 Results", meta: "Company earnings release · May 7, 2026", href: "https://investors.rocketlabcorp.com/news-releases/news-release-details/rocket-lab-announces-first-quarter-2026-financial-results", excerpt: "The official release reports revenue, margin, backlog, liquidity, launch contracts, acquisitions, and second-quarter guidance." },
      { title: "Rocket Lab Q1 2026 Form 10-Q", meta: "Company-hosted SEC filing", href: "https://investors.rocketlabcorp.com/sec-filings/sec-filing/10-q/0001819994-26-000028", excerpt: "The filing provides accounting, liquidity, acquisition, contract, risk, and share-count detail behind the earnings release." },
      { title: "Rocket Lab Quarterly Results", meta: "Company primary materials", href: "https://investors.rocketlabcorp.com/financial-information/quarterly-results", excerpt: "Official press releases, presentations, webcasts, and quarterly filings across reporting periods." },
    ],
  },
  BB: {
    reviewed: "August 1, 2026",
    completeness: 94,
    newsroomUrl: "https://investors.blackberry.com/press-releases",
    financialDrivers: [
      { label: "QNX ROYALTIES", value: "Vehicle programs", detail: "Design wins, production volumes, royalty timing, pricing, and the conversion of backlog into revenue" },
      { label: "DEVELOPMENT SEATS", value: "Developer adoption", detail: "Seat growth can lead production royalties but does not guarantee timing or vehicle volume" },
      { label: "SECURE COMMUNICATIONS", value: "Recurring resilience", detail: "Government and enterprise renewals, critical-event demand, churn, and operating margin" },
      { label: "CAPITAL ALLOCATION", value: "Cash versus growth", detail: "R&D, partnerships, acquisitions, buybacks, and the cash cost of restructuring or separation" },
    ],
    monitor: [
      { title: "QNX backlog conversion", text: "Reconcile announced design wins and royalty backlog with vehicle launches, units produced, average royalty, and recognized revenue.", impact: "BULL CASE" },
      { title: "Secure Communications retention", text: "Track annual recurring revenue, dollar retention, government wins, churn, and segment operating cash generation.", impact: "NEUTRAL" },
      { title: "Automotive architecture competition", text: "Follow OEM insourcing, open-source alternatives, Android Automotive, AUTOSAR, safety certification, and developer adoption.", impact: "BEAR CASE" },
    ],
    questions: [
      "When and at what economics will the QNX royalty backlog convert?",
      "Which automotive layers can QNX monetize beyond the real-time operating system?",
      "Can Secure Communications grow while preserving certification-led differentiation?",
      "What capital-allocation policy best serves owners now that the portfolio is more focused?",
    ],
    comparables: [
      { name: "Aptiv", ticker: "APTV", ownership: "Public", relationship: "Software-defined vehicle architecture and automotive systems comparable", valuation: "Separate software, signal-and-power, and cyclical auto exposure", financialStatus: "Profitable global automotive technology supplier with substantial OEM concentration.", sourceUrl: "https://ir.aptiv.com/" },
      { name: "Continental", ticker: "CON.DE", ownership: "Public", relationship: "Parent of Elektrobit and automotive software competitor", valuation: "Conglomerate and restructuring context limits direct comparison", financialStatus: "Large public automotive supplier with software, electronics, and tire operations.", sourceUrl: "https://www.continental.com/en/investors/" },
      { name: "Motorola Solutions", ticker: "MSI", ownership: "Public", relationship: "Mission-critical communications and public-safety software comparable", valuation: "Compare recurring software and services growth plus cash conversion", financialStatus: "Profitable communications and command-center platform with strong public-safety exposure.", sourceUrl: "https://www.motorolasolutions.com/en_us/about/investors.html" },
      { name: "Wind River", ticker: "—", ownership: "Private", relationship: "Embedded and automotive operating-software competitor", valuation: "No standalone public valuation", financialStatus: "Privately held software platform; customer and segment economics are less transparent than public filings.", sourceUrl: "https://www.windriver.com/" },
    ],
    sources: [
      { title: "BlackBerry SEC filing library", meta: "SEC EDGAR · Primary filings", href: sec("1070235"), excerpt: "BlackBerry filings disclose QNX and Secure Communications economics, contracts, backlog measures, cash, investments, restructuring, competition, and risk." },
      { title: "BlackBerry Fiscal Q1 2027 Results", meta: "Company results hub · June 25, 2026", href: "https://investors.blackberry.com/", excerpt: "The investor-relations home page links the latest earnings presentation, quarterly report, press release, supplemental information, and replay." },
      { title: "BlackBerry Quarterly Results", meta: "Company financial archive", href: "https://investors.blackberry.com/quarterly-results", excerpt: "Official financial information, supplemental data, earnings releases, annual reports, and transcripts by fiscal period." },
      { title: "BlackBerry Press Releases", meta: "Company primary materials", href: "https://investors.blackberry.com/press-releases", excerpt: "Official product, customer, partnership, financial, and corporate announcements." },
    ],
  },
  BE: {
    reviewed: "August 1, 2026",
    completeness: 96,
    newsroomUrl: "https://investor.bloomenergy.com/press-releases/default.aspx",
    financialDrivers: [
      { label: "Q1 REVENUE", value: "$751.1M · +130%", detail: "Product growth drove the increase; shipments, acceptance, customer and project mix create quarterly variability" },
      { label: "GAAP GROSS MARGIN", value: "30.0%", detail: "Manufacturing cost, mix, installation, warranty, service, and pricing determine durability" },
      { label: "GAAP OPERATING INCOME", value: "$72.2M", detail: "Evidence of operating leverage, but cash conversion and working capital remain essential" },
      { label: "2026 REVENUE GUIDE", value: "$3.4B–$3.8B", detail: "Raised April guidance; delivery, customer concentration, financing, and supply execution must support it" },
    ],
    monitor: [
      { title: "Data-center project conversion", text: "Track signed projects through permits, interconnection, manufacturing, installation, acceptance, payment, and recurring service.", impact: "BULL CASE" },
      { title: "Product and service margins", text: "Separate equipment mix from the installed-base service economics and warranty obligations.", impact: "NEUTRAL" },
      { title: "Customer and policy concentration", text: "Measure large-project exposure, tax-credit reliance, utility rules, gas economics, and financing availability.", impact: "BEAR CASE" },
    ],
    questions: [
      "How much backlog is firm, financed, permitted, and scheduled?",
      "What lifetime return does Bloom earn after installation, warranty, and service obligations?",
      "Can manufacturing scale preserve margins as project size grows?",
      "How sensitive is customer demand to gas prices, tax policy, and grid interconnection timing?",
    ],
    comparables: [
      { name: "FuelCell Energy", ticker: "FCEL", ownership: "Public", relationship: "Stationary fuel-cell technology competitor", valuation: "Compare liquidity and project economics before revenue multiples", financialStatus: "Smaller, loss-making platform with development and financing risk.", sourceUrl: "https://investor.fce.com/" },
      { name: "Cummins", ticker: "CMI", ownership: "Public", relationship: "Distributed power, engines, generators, and electrolyzer competitor", valuation: "Diversified industrial earnings reduce direct comparability", financialStatus: "Large profitable power supplier funding lower-carbon technologies from mature operations.", sourceUrl: "https://investor.cummins.com/" },
      { name: "Caterpillar", ticker: "CAT", ownership: "Public", relationship: "Distributed generation and data-center power competitor", valuation: "Compare Power & Energy results, not consolidated construction multiples alone", financialStatus: "Highly profitable diversified equipment and power company with dealer and financing scale.", sourceUrl: "https://investors.caterpillar.com/" },
      { name: "GE Vernova", ticker: "GEV", ownership: "Public", relationship: "Grid, gas-power, electrification, and energy-services competitor", valuation: "Compare segment backlog, margin, and free cash flow", financialStatus: "Scaled energy-equipment platform spanning Power, Wind, and Electrification.", sourceUrl: "https://www.gevernova.com/investors" },
    ],
    sources: [
      { title: "Bloom Energy SEC filing library", meta: "SEC EDGAR · Primary filings", href: sec("1664703"), excerpt: "Bloom filings describe Energy Server sales and installations, service obligations, customer and supplier exposure, financing, policy, cash, backlog, and risk." },
      { title: "Bloom Energy Q1 2026 Results", meta: "Company earnings release · April 28, 2026", href: "https://investor.bloomenergy.com/press-releases/press-release-details/2026/Bloom-Energy-Reports-Record-First-Quarter-2026-Results-and-Raises-Full-Year-2026-Guidance/default.aspx", excerpt: "The official release reports revenue, product growth, margins, operating income, non-GAAP reconciliations, and raised full-year guidance." },
      { title: "Bloom Energy SEC Filings", meta: "Company-hosted filing index", href: "https://investor.bloomenergy.com/financials-and-filings/sec-filings/default.aspx", excerpt: "Annual, quarterly, current, ownership, and other filings with direct document formats." },
      { title: "Bloom Energy Press Releases", meta: "Company primary materials", href: "https://investor.bloomenergy.com/press-releases/default.aspx", excerpt: "Official customer, partnership, product, financial, and corporate announcements." },
    ],
  },
  BA: {
    reviewed: "August 1, 2026",
    completeness: 96,
    newsroomUrl: "https://investors.boeing.com/investors/news/",
    financialDrivers: [
      { label: "Q1 REVENUE", value: "$22.2B · +14%", detail: "Commercial deliveries and defense/services mix; volume is only useful when quality and program economics improve" },
      { label: "Q2 DELIVERIES", value: "171 aircraft", detail: "129 737s and 25 787s among Q2 deliveries; cash timing and customer acceptance remain critical" },
      { label: "TOTAL BACKLOG", value: "$694.7B", detail: "March 2026 company backlog, including $575.6B of Commercial Airplanes; backlog is not profit" },
      { label: "FREE CASH FLOW", value: "Recovery test", detail: "Advances, inventory, delivery payments, supplier support, certification, and program charges drive cash conversion" },
    ],
    monitor: [
      { title: "737 and 787 stable production", text: "Track conforming units, traveled work, rework, supplier readiness, FAA oversight, deliveries, and inventory—not monthly rate alone.", impact: "BULL CASE" },
      { title: "Certification and development programs", text: "Follow 737-7/-10, 777X, defense development milestones, schedule, and cumulative charges.", impact: "NEUTRAL" },
      { title: "Cash and balance sheet", text: "Reconcile delivery growth to advances, inventory, free cash flow, debt, pensions, customer concessions, and supplier financing.", impact: "BEAR CASE" },
    ],
    questions: [
      "What evidence proves production stability rather than short-term delivery catch-up?",
      "Which fixed-price defense programs still carry material loss risk?",
      "When will inventory and advances convert into durable free cash flow?",
      "How much capital and management attention will integration and certification require?",
    ],
    comparables: [
      { name: "Airbus", ticker: "AIR.PA", ownership: "Public", relationship: "Primary large-commercial-aircraft competitor", valuation: "Compare delivery mix, backlog, advances, net cash, and program risk", financialStatus: "Profitable global aerospace group with commercial, helicopter, and defense operations.", sourceUrl: "https://www.airbus.com/en/investors" },
      { name: "Lockheed Martin", ticker: "LMT", ownership: "Public", relationship: "Defense, space, and government-program competitor", valuation: "Compare backlog quality, margins, and cash conversion", financialStatus: "Large profitable defense prime with lower commercial-aerospace exposure.", sourceUrl: "https://investors.lockheedmartin.com/" },
      { name: "RTX", ticker: "RTX", ownership: "Public", relationship: "Commercial engines, systems, aftermarket, and defense comparable", valuation: "Separate Pratt, Collins, and Raytheon economics", financialStatus: "Diversified aerospace and defense supplier with large aftermarket exposure.", sourceUrl: "https://investors.rtx.com/" },
      { name: "Northrop Grumman", ticker: "NOC", ownership: "Public", relationship: "Defense, space, and fixed-price program comparable", valuation: "Compare funded backlog, margin, and program-charge risk", financialStatus: "Large profitable defense prime concentrated in government programs.", sourceUrl: "https://investor.northropgrumman.com/" },
    ],
    sources: [
      { title: "Boeing SEC filing library", meta: "SEC EDGAR · Primary filings", href: sec("12927"), excerpt: "Boeing filings describe commercial, defense, space, and services programs; inventories; advances; debt; certification; suppliers; contingencies; and program accounting." },
      { title: "Boeing First-Quarter 2026 Results", meta: "Company earnings release · April 22, 2026", href: "https://investors.boeing.com/investors/news/press-release-details/2026/Boeing-Reports-First-Quarter-Results/default.aspx", excerpt: "The official release reports revenue, delivery, margin, cash flow, backlog, production, certification, and segment results." },
      { title: "Boeing Q2 2026 Deliveries", meta: "Company operational release · July 14, 2026", href: "https://investors.boeing.com/investors/news/press-release-details/2026/Boeing-Announces-Second-Quarter-Deliveries/default.aspx", excerpt: "The release reports commercial and defense program deliveries for the quarter and year to date while noting that delivery data is not final financial performance." },
      { title: "Boeing Investor Reports", meta: "Company primary materials", href: "https://investors.boeing.com/investors/reports/default.aspx", excerpt: "Quarterly and annual reports, SEC filings, sustainability materials, accounting considerations, and interactive financial information." },
    ],
  },
  CAT: {
    reviewed: "August 1, 2026",
    completeness: 96,
    newsroomUrl: "https://investors.caterpillar.com/news/default.aspx",
    financialDrivers: [
      { label: "Q1 SALES & REVENUE", value: "$17.4B · +22%", detail: "Volume and price realization drove growth; segment and end-market mix determine profit quality" },
      { label: "OPERATING MARGIN", value: "17.7% GAAP", detail: "Price, volume, manufacturing cost, currency, mix, and restructuring" },
      { label: "ENTERPRISE CASH FLOW", value: "$1.9B", detail: "First-quarter operating cash flow before the timing of working capital and capital allocation" },
      { label: "CAPITAL RETURNS", value: "$5.7B in Q1", detail: "$5.0B of repurchases and $0.7B of dividends; judge repurchases against cycle and valuation" },
    ],
    monitor: [
      { title: "Dealer inventory and end-user demand", text: "Compare reported sales with retail statistics, dealer inventories, order rates, backlog, utilization, and rental fleets.", impact: "NEUTRAL" },
      { title: "Power & Energy mix", text: "Track data-center, oil-and-gas, turbine, engine, aftermarket, and distributed-power growth and margins.", impact: "BULL CASE" },
      { title: "Price-cost and capital returns", text: "Measure price realization against labor, freight, components, tariffs, currency, and the value created by repurchases.", impact: "BEAR CASE" },
    ],
    questions: [
      "How much current growth is end demand versus dealer restocking?",
      "Can Power & Energy structurally raise Caterpillar's through-cycle earnings quality?",
      "What margin is sustainable when price-cost tailwinds normalize?",
      "Do repurchases create per-share value near peak-cycle earnings?",
    ],
    comparables: [
      { name: "Komatsu", ticker: "6301.T", ownership: "Public", relationship: "Global construction and mining equipment competitor", valuation: "Compare geography, mining mix, aftermarket, and currency", financialStatus: "Profitable Japanese equipment manufacturer with broad mining and construction exposure.", sourceUrl: "https://www.komatsu.jp/en/ir/" },
      { name: "Deere & Company", ticker: "DE", ownership: "Public", relationship: "Heavy equipment, precision technology, and finance comparable", valuation: "Agriculture-cycle exposure differs from Caterpillar", financialStatus: "Profitable equipment manufacturer with a large captive-finance operation.", sourceUrl: "https://investor.deere.com/" },
      { name: "Cummins", ticker: "CMI", ownership: "Public", relationship: "Engine, power-generation, components, and distribution competitor", valuation: "Compare power exposure, margins, and cash conversion", financialStatus: "Profitable diversified power supplier investing across traditional and lower-carbon technologies.", sourceUrl: "https://investor.cummins.com/" },
      { name: "Hitachi Construction Machinery", ticker: "6305.T", ownership: "Public", relationship: "Construction and mining equipment competitor", valuation: "Compare dealer, rental, mining, and regional mix", financialStatus: "Public Japanese machinery company with global mining and construction exposure.", sourceUrl: "https://www.hitachicm.com/global/en/ir/" },
    ],
    sources: [
      { title: "Caterpillar SEC filing library", meta: "SEC EDGAR · Primary filings", href: sec("18230"), excerpt: "Caterpillar filings report Construction Industries, Resource Industries, Power & Energy, Financial Products, dealer inventory, cash, financing, competition, and risk." },
      { title: "Caterpillar Q1 2026 Results", meta: "Company earnings release · April 30, 2026", href: "https://investors.caterpillar.com/financials/quarterly-results/default.aspx", excerpt: "The official results page reports sales, operating margin, earnings per share, cash flow, capital returns, segment results, retail statistics, and links to the Form 10-Q." },
      { title: "Caterpillar Events and Presentations", meta: "Company primary materials", href: "https://investors.caterpillar.com/events-presentations/default.aspx", excerpt: "Official earnings slides, webcasts, transcripts, investor presentations, and event materials." },
      { title: "Caterpillar Investor Relations", meta: "Company primary materials", href: "https://investors.caterpillar.com/", excerpt: "Quarterly results, SEC filings, governance, financial history, retail statistics, and shareholder information." },
    ],
  },
};
