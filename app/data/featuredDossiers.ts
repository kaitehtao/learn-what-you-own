import { additionalFlagshipDossiers } from "./additionalFlagshipDossiers";
import { completeDossierBenchmark, dossierBenchmarkComplements } from "./dossierBenchmarkComplements";
import { sp500Batch01Dossiers } from "./sp500Batch01Dossiers";
import { sp500Batch02Dossiers } from "./sp500Batch02Dossiers";
import { sp500Batch03Dossiers } from "./sp500Batch03Dossiers";
import { sp500Batch04Dossiers } from "./sp500Batch04Dossiers";
import { sp500Batch05Dossiers } from "./sp500Batch05Dossiers";
import { sp500Batch06Dossiers } from "./sp500Batch06Dossiers";
import { legacyCompleteDossiers } from "./legacyCompleteDossiers";
import { applyEvidenceStandard } from "./structuredDossierFactory";
import { fcelDossier } from "./fcelDossier";

export type FeaturedDossier = {
  ticker: string;
  reviewed?: string;
  completeness?: number;
  newsroomUrl?: string;
  newsroomFeedUrl?: string;
  description: string;
  lede: string;
  sells: string;
  revenueModel: string;
  opportunity: string;
  mustGoRight: string;
  editorNote: string;
  bullTitle: string;
  bull: string[];
  bearTitle: string;
  bear: string[];
  thesisBreaker: string;
  financialDrivers: { label: string; value: string; detail: string }[];
  risks: { title: string; level: "High" | "Medium"; text: string; signal: string }[];
  monitor: { title: string; text: string; impact: "BULL CASE" | "BEAR CASE" | "NEUTRAL" }[];
  questions: string[];
  competitors: string;
  evidenceReview?: {
    reviewedAt: string;
    annualFilingsUrl: string;
    quarterlyFilingsUrl: string;
    earningsUpdatesUrl: string;
    proxyFilingsUrl: string;
    officialMaterialsUrl: string;
    transcriptPolicy: string;
  };
  performance?: {
    label: string;
    value: string;
    asOf: string;
    detail: string;
    drivers: { title: string; detail: string; sourceUrl: string }[];
  };
  comparables?: {
    name: string;
    ticker: string;
    ownership: "Public" | "Private";
    relationship: string;
    valuation: string;
    financialStatus: string;
    sourceUrl: string;
  }[];
  sources: { title: string; meta: string; href: string; excerpt: string }[];
};

import { flagshipDossierUpgrades } from "./featuredDossierUpgrades";
import { spcxDossier } from "./spcxDossier";
import { tslaDossier } from "./tslaDossier";

export const featuredDossiers: Record<string, FeaturedDossier> = {
  AMZN: {
    ticker: "AMZN",
    description: "Global commerce, cloud infrastructure, advertising, and digital services.",
    lede: "Amazon combines a high-scale consumer marketplace with AWS, advertising, logistics, and subscription businesses that reinforce one another.",
    sells: "Online and physical retail, third-party marketplace services, cloud computing, advertising, devices, entertainment, and subscriptions.",
    revenueModel: "Product sales, seller fees, cloud usage, advertising placements, Prime memberships, and other recurring services.",
    opportunity: "Commerce scale creates traffic and fulfillment density, while AWS and advertising add higher-margin profit pools.",
    mustGoRight: "AWS must remain a preferred computing platform, retail efficiency must improve, and capital spending must earn attractive returns.",
    editorNote: "The ownership debate centers on whether Amazon can convert its unmatched operating footprint into sustainably higher free cash flow without weakening customer value.",
    bullTitle: "Several durable platforms under one roof",
    bull: ["AWS participates in long-duration cloud and AI infrastructure demand.", "Marketplace scale strengthens selection, convenience, and advertising reach.", "Fulfillment density and automation can improve retail economics over time."],
    bearTitle: "Scale carries a very large reinvestment bill",
    bear: ["Cloud competition can pressure growth and pricing.", "Retail remains operationally complex and exposed to labor and delivery costs.", "Heavy infrastructure spending can outrun monetization."],
    thesisBreaker: "A sustained loss of AWS relevance combined with structurally weak retail returns would undermine the case that Amazon’s reinvestment compounds owner value.",
    financialDrivers: [{ label: "AWS", value: "Cloud growth", detail: "Usage, AI workloads, pricing, and operating margin" }, { label: "NORTH AMERICA", value: "Retail efficiency", detail: "Fulfillment cost, delivery speed, and mix" }, { label: "ADVERTISING", value: "High-margin scale", detail: "Sponsored products and measurable demand" }],
    risks: [{ title: "Capital intensity", level: "High", text: "Data centers and fulfillment infrastructure require substantial capital before demand is fully visible.", signal: "Capex growth versus operating cash flow" }, { title: "Cloud competition", level: "High", text: "Microsoft, Google, and specialized providers compete for enterprise and AI workloads.", signal: "AWS growth and margin trend" }, { title: "Regulatory scrutiny", level: "Medium", text: "Marketplace practices, labor, data, and competition remain under global review.", signal: "Material remedies or operating restrictions" }],
    monitor: [{ title: "AWS AI infrastructure conversion", text: "Track whether AI capacity translates into durable usage growth and returns.", impact: "BULL CASE" }, { title: "Retail cost-to-serve", text: "Watch regionalization, delivery density, and unit economics.", impact: "NEUTRAL" }],
    questions: ["Can AWS sustain attractive returns through the AI buildout?", "How much further can retail margins structurally improve?", "Does advertising strengthen or weaken marketplace trust?"],
    competitors: "Microsoft Azure, Google Cloud, Walmart, Shopify, Alibaba, and digital advertising platforms.",
    sources: [{ title: "Amazon SEC filing library", meta: "SEC EDGAR · Primary source", href: "https://www.sec.gov/edgar/browse/?CIK=1018724&owner=exclude", excerpt: "Amazon’s filings report results across North America, International, and AWS and describe its principal products, services, risks, and capital requirements." }, { title: "Amazon Investor Relations", meta: "Company investor materials", href: "https://ir.aboutamazon.com/", excerpt: "Official earnings releases, presentations, annual reports, and shareholder information published by Amazon." }],
  },
  AAPL: {
    ticker: "AAPL",
    description: "Integrated consumer devices, operating systems, software, and services.",
    lede: "Apple monetizes a tightly integrated installed base through premium devices and a growing portfolio of services.",
    sells: "iPhone, Mac, iPad, wearables, accessories, software, payments, cloud, media, and warranty services.",
    revenueModel: "Device sales plus recurring and transaction-based services distributed across Apple’s installed base.",
    opportunity: "Brand, custom silicon, software integration, distribution, and ecosystem loyalty support premium economics.",
    mustGoRight: "Apple must keep its devices differentiated, expand services responsibly, and create compelling new reasons to upgrade.",
    editorNote: "The central question is whether ecosystem strength can offset mature smartphone markets and preserve growth without overreliance on price and buybacks.",
    bullTitle: "An exceptional installed-base business",
    bull: ["Deep hardware-software integration supports loyalty and premium pricing.", "Services can deepen engagement and recurring revenue.", "Custom silicon improves product performance and strategic control."],
    bearTitle: "A premium franchise facing mature categories",
    bear: ["iPhone remains the economic center of the company.", "App distribution and default arrangements face regulatory pressure.", "China exposure creates demand, supply-chain, and geopolitical risk."],
    thesisBreaker: "A durable decline in ecosystem loyalty or loss of control over critical distribution economics would weaken Apple’s premium-return model.",
    financialDrivers: [{ label: "IPHONE", value: "Installed base", detail: "Upgrades, mix, pricing, and geographic demand" }, { label: "SERVICES", value: "Recurring value", detail: "Paid subscriptions, transactions, and regulation" }, { label: "CAPITAL RETURNS", value: "Per-share growth", detail: "Free cash flow, buybacks, and valuation" }],
    risks: [{ title: "Product concentration", level: "High", text: "The iPhone anchors device revenue and ecosystem activity.", signal: "Installed-base and upgrade trends" }, { title: "Platform regulation", level: "High", text: "Rules affecting app distribution, payments, and default services could alter economics.", signal: "Remedies affecting commissions or defaults" }, { title: "China exposure", level: "High", text: "Apple depends on China for important demand and manufacturing capacity.", signal: "Regional sales and supply diversification" }],
    monitor: [{ title: "On-device intelligence adoption", text: "Measure whether new software capabilities stimulate upgrades and services.", impact: "BULL CASE" }, { title: "App ecosystem remedies", text: "Track changes to distribution, payments, and default arrangements.", impact: "BEAR CASE" }],
    questions: ["What drives the next durable replacement cycle?", "How much services profit is exposed to regulation?", "Can new product categories become economically material?"],
    competitors: "Samsung, Google, Microsoft, Huawei, Xiaomi, and competing payments and media ecosystems.",
    sources: [{ title: "Apple SEC filing library", meta: "SEC EDGAR · Primary source", href: "https://www.sec.gov/edgar/browse/?CIK=320193&owner=exclude", excerpt: "Apple’s filings describe its reportable products, services, geographic exposure, supply chain, platform risks, and capital-return program." }, { title: "Apple Investor Relations", meta: "Company investor materials", href: "https://investor.apple.com/", excerpt: "Official results, SEC filings, annual reports, governance materials, and shareholder information published by Apple." }],
  },
  NVDA: {
    ticker: "NVDA",
    description: "Accelerated computing platforms spanning chips, systems, networking, and software.",
    lede: "NVIDIA has evolved from a graphics-chip company into a full-stack accelerated-computing platform central to modern AI infrastructure.",
    sells: "GPUs, networking, systems, software, and platform services for data center, gaming, visualization, automotive, and edge markets.",
    revenueModel: "Semiconductor and system sales, networking, software licensing, support, and cloud-access services.",
    opportunity: "AI training and inference are increasing demand for accelerated computing, while CUDA and system-level integration strengthen adoption.",
    mustGoRight: "Customers must continue earning value from AI infrastructure and NVIDIA must maintain performance, supply, and ecosystem leadership.",
    editorNote: "The debate is no longer whether AI compute demand exists; it is how durable NVIDIA’s share and returns remain as customers, competitors, and custom silicon mature.",
    bullTitle: "The full-stack standard for accelerated computing",
    bull: ["CUDA and developer adoption create a powerful software ecosystem.", "Chips, networking, systems, and software are co-designed.", "Rapid product cadence expands performance and total platform value."],
    bearTitle: "Extraordinary demand invites extraordinary competition",
    bear: ["Large customers are developing custom accelerators.", "Demand is concentrated among a limited number of major buyers.", "Export restrictions and supply dependencies can constrain reachable markets."],
    thesisBreaker: "If workload economics shift decisively toward alternative accelerators while NVIDIA’s software advantage erodes, current platform expectations would require reassessment.",
    financialDrivers: [{ label: "DATA CENTER", value: "AI demand", detail: "Training, inference, systems, and networking" }, { label: "PLATFORM MIX", value: "Full-stack value", detail: "Compute, networking, software, and services" }, { label: "SUPPLY", value: "Execution", detail: "Foundry, memory, packaging, and system availability" }],
    risks: [{ title: "Customer concentration", level: "High", text: "A small group of cloud and technology companies drives substantial infrastructure spending.", signal: "Customer capex and order concentration" }, { title: "Custom silicon", level: "High", text: "Hyperscalers and competitors are investing in alternative accelerators.", signal: "Workload share and relative performance" }, { title: "Export controls", level: "High", text: "Restrictions can limit product configurations and addressable markets.", signal: "New rules and license requirements" }],
    monitor: [{ title: "Inference economics", text: "Track performance per dollar as AI shifts from training toward broad deployment.", impact: "BULL CASE" }, { title: "Alternative accelerator adoption", text: "Separate supplemental custom silicon from true platform displacement.", impact: "BEAR CASE" }],
    questions: ["How durable is CUDA as inference architectures diversify?", "Can supply scale without sacrificing returns?", "What portion of demand is recurring versus buildout-driven?"],
    competitors: "AMD, Intel, hyperscaler custom silicon, Broadcom-enabled ASICs, and specialized AI accelerator companies.",
    sources: [{ title: "NVIDIA SEC filing library", meta: "SEC EDGAR · Primary source", href: "https://www.sec.gov/edgar/browse/?CIK=1045810&owner=exclude", excerpt: "NVIDIA’s filings describe its compute and networking platforms, market platforms, customer concentration, supply dependencies, export controls, and competitive risks." }, { title: "NVIDIA Investor Relations", meta: "Company investor materials", href: "https://investor.nvidia.com/", excerpt: "Official financial results, presentations, SEC filings, events, and governance materials published by NVIDIA." }],
  },
  CRWV: {
    ticker: "CRWV",
    reviewed: "August 1, 2026",
    completeness: 100,
    newsroomUrl: "https://www.coreweave.com/newsroom",
    description: "Purpose-built AI cloud infrastructure spanning accelerated compute, storage, networking, orchestration, and managed software.",
    lede: "CoreWeave is an AI-native cloud operator that finances, deploys, and manages dense NVIDIA-based infrastructure for AI laboratories, hyperscalers, and enterprises. The company is growing extraordinarily quickly, but owners are underwriting both a cloud platform and a highly leveraged infrastructure buildout.",
    sells: "Contracted and on-demand GPU compute, CPU compute, high-performance storage and networking, Kubernetes and Slurm orchestration, observability, fleet management, and managed AI software services.",
    revenueModel: "Primarily multi-year committed capacity and usage-based cloud consumption. Revenue is recognized as contracted compute and services are delivered; backlog is not revenue and remains subject to delivery schedules, variable consideration, service credits, and contractual terms.",
    opportunity: "AI training and inference require scarce power, advanced accelerators, dense networking, and operational expertise. CoreWeave aims to deploy new NVIDIA systems faster and with more workload specialization than general-purpose clouds.",
    mustGoRight: "The company must convert $99.4 billion of backlog into high-utilization revenue, deliver contracted power and data centers on schedule, keep customers committed, refinance efficiently, and earn returns above its debt, lease, and hardware-obsolescence costs.",
    editorNote: "The central ownership question is not whether AI compute demand exists. It is whether CoreWeave can turn contracted demand into durable owner cash flow after equipment purchases, interest, leases, customer concentration, and continuous GPU replacement. Q1 2026 revenue doubled, yet $7.7 billion of property-and-equipment purchases exceeded $3.0 billion of operating cash flow and principal debt reached $25.1 billion.",
    bullTitle: "Contracted AI demand plus specialized execution",
    bull: ["Revenue increased 112% year over year to $2.08 billion in Q1 2026, while backlog reached $99.4 billion.", "CoreWeave surpassed 1 GW of active power and reported more than 3.5 GW of contracted power, creating a visible physical path for additional capacity.", "NVIDIA invested $2.0 billion at $87.20 per share and expanded its technology collaboration with CoreWeave across future platform generations.", "Q1 operating cash flow rose to $2.98 billion as customer collections increased, demonstrating that contracted capacity can generate meaningful cash before growth investment."],
    bearTitle: "The backlog comes with an enormous financing obligation",
    bear: ["CoreWeave reported $25.15 billion of principal debt at March 31, 2026, plus $16.98 billion of undiscounted operating-lease payments.", "The top two customers generated approximately 65% of Q1 revenue, and customers can also be competitors or build internal infrastructure.", "All GPUs in CoreWeave’s infrastructure were NVIDIA GPUs because of customer contract requirements, creating concentrated technology and supply dependence.", "Adjusted operating margin fell to 1% from 17% a year earlier; net interest expense reached $536 million and the quarter produced a $740 million GAAP net loss."],
    thesisBreaker: "The thesis breaks if capacity delivery slips, customers reduce or reprice commitments, or utilization and cash collections fail to cover debt service, leases, and the replacement cost of rapidly aging accelerators. A large backlog would not protect owners if financing remains structurally more expensive than the returns earned on deployed clusters.",
    financialDrivers: [
      { label: "Q1 REVENUE", value: "$2.08B · +112%", detail: "Growth must be judged alongside adjusted operating margin of 1% and a $740M GAAP net loss" },
      { label: "REVENUE BACKLOG", value: "$99.4B", detail: "Watch delivery timing, variable consideration, customer mix, and conversion into collected revenue" },
      { label: "POWER CAPACITY", value: ">1 GW active", detail: ">3.5 GW contracted at March 31; execution depends on power, sites, hardware, and commissioning" },
      { label: "CUSTOMER MIX", value: "65% top two", detail: "Q1 2026 concentration; OpenAI and Meta commitments increase visibility but not diversification" },
      { label: "CASH INVESTMENT", value: "$7.70B Q1 capex", detail: "$2.98B operating cash flow did not fund the full property-and-equipment build" },
      { label: "CAPITAL STRUCTURE", value: "$25.15B debt", detail: "$2.24B cash, $8.83B facility availability, and $16.98B undiscounted operating-lease payments at quarter-end" },
    ],
    risks: [
      { title: "Leverage, leases, and refinancing", level: "High", text: "CoreWeave funds infrastructure with secured facilities, notes, OEM financing, equity, and long-dated leases. High fixed obligations magnify delivery, pricing, utilization, and credit-market risk.", signal: "Interest expense, debt maturities, lease commitments, borrowing cost, and capex-to-operating-cash-flow" },
      { title: "Customer concentration and bargaining power", level: "High", text: "The top two customers represented about 65% of Q1 revenue. OpenAI, Meta, Microsoft, and other large buyers can negotiate aggressively, shift workloads, or build competing infrastructure.", signal: "Top-customer revenue share, backlog amendments, credits, renewals, and new-customer contribution" },
      { title: "NVIDIA and hardware-generation dependence", level: "High", text: "All deployed GPUs were NVIDIA GPUs under customer requirements. Allocation, pricing, networking, memory, fabrication, and product-transition problems can delay revenue or compress returns.", signal: "GPU delivery timing, supplier concentration, Rubin adoption, and price-performance by generation" },
      { title: "Data-center and power delivery", level: "High", text: "CoreWeave relies on third-party facilities, utilities, construction, networking, and liquid-cooling infrastructure. The company disclosed prior third-party data-center delivery delays.", signal: "Active versus contracted power, commissioning dates, service credits, and provider delays" },
      { title: "Internal controls and scaling", level: "Medium", text: "The Q1 filing continued to identify material weaknesses involving IT controls, segregation of duties, and finance personnel capacity.", signal: "Remediation disclosures, audit findings, restatements, and reporting delays" },
    ],
    monitor: [
      { title: "Second-quarter results · August 11", text: "Test backlog conversion, capacity delivery, margin progression, interest burden, cash investment, and any change to full-year guidance.", impact: "NEUTRAL" },
      { title: "Backlog-to-cash conversion", text: "Compare new bookings with revenue, deferred revenue, receivables, operating cash flow, and commissioned capacity—not backlog growth alone.", impact: "BULL CASE" },
      { title: "Financing cost versus cluster returns", text: "Track incremental borrowing rates, interest coverage, lease-adjusted obligations, and cash return on each deployed hardware generation.", impact: "BEAR CASE" },
      { title: "Customer diversification", text: "Measure whether enterprise and AI-native wins reduce dependence on the largest customers as Meta, OpenAI, and Anthropic commitments ramp.", impact: "BULL CASE" },
      { title: "NVIDIA Rubin deployment", text: "Management expected Rubin deployment in the second half of 2026; schedule, utilization, and price-performance will test execution through a major platform transition.", impact: "NEUTRAL" },
    ],
    questions: ["What percentage of the $99.4B backlog is funded by customer prepayments or take-or-pay protections?", "What are cash-on-cash returns by GPU generation after interest, leases, power, and replacement capex?", "How much Q1 operating cash flow came from durable economics versus billing and working-capital timing?", "Which obligations remain if a customer delays acceptance or reduces usage?", "When will the top-two customer share fall materially below 65%?", "What evidence will demonstrate that the disclosed internal-control weaknesses have been remediated?"],
    competitors: "Direct and adjacent competitors include Nebius, IREN, Lambda, Crusoe, Oracle Cloud Infrastructure, AWS, Microsoft Azure, and Google Cloud. NVIDIA is a strategic supplier, investor, and platform partner—not a straightforward valuation peer.",
    performance: {
      label: "2026 YTD share-price return",
      value: "+0.2%",
      asOf: "December 31, 2025 close $71.61 → July 31, 2026 close $71.77",
      detail: "The near-flat year-to-date result conceals extreme volatility: shares traded in a 52-week range of $60.55 to $153.20. Contract wins, backlog, and NVIDIA alignment supported the upside, while capital intensity, leverage, delivery risk, and margin pressure repeatedly reset the valuation. These are evidence-backed influences, not a claim that any one item caused a particular daily move.",
      drivers: [
        { title: "$99.4B backlog and new customer commitments", detail: "Q1 brought CoreWeave’s strongest bookings quarter, including a new $21B Meta commitment and a multi-year Anthropic agreement. Backlog creates visibility, but delivery and contract quality determine value.", sourceUrl: "https://investors.coreweave.com/news/news-details/2026/CoreWeave-Reports-Strong-First-Quarter-2026-Results/" },
        { title: "More than 1 GW active; over 3.5 GW contracted", detail: "The physical buildout expanded quickly. The spread between contracted and active power is both the growth runway and the execution burden owners must monitor.", sourceUrl: "https://investors.coreweave.com/news/news-details/2026/CoreWeave-Reports-Strong-First-Quarter-2026-Results/" },
        { title: "$2B NVIDIA investment and deeper roadmap alignment", detail: "NVIDIA bought roughly 23M shares at $87.20 and expanded a collaboration framework spanning future compute, CPU, storage, and software platforms.", sourceUrl: "https://www.sec.gov/Archives/edgar/data/1769628/000176962826000044/ex991pressrelease_final.htm" },
        { title: "Growth required more cash than operations supplied", detail: "Q1 operating cash flow was $2.98B, but property-and-equipment purchases were $7.70B. Principal debt was $25.15B and net interest expense was $536M, keeping financing risk central to the stock debate.", sourceUrl: "https://www.sec.gov/Archives/edgar/data/1769628/000176962826000222/crwv-20260331.htm" },
      ],
    },
    comparables: [
      { name: "Nebius Group", ticker: "NBIS", ownership: "Public", relationship: "Closest listed AI-native cloud comparable; smaller current revenue base with a different funding profile.", valuation: "≈$48.1B equity / $48.3B EV (Jul. 27)", financialStatus: "Q1 2026 revenue was $399M, including $390M from AI cloud; still scaling and not yet a mature-profit peer.", sourceUrl: "https://stockanalysis.com/stocks/nbis/financials/ratios/?p=quarterly" },
      { name: "IREN", ticker: "IREN", ownership: "Public", relationship: "Vertically integrated power and data-center operator expanding from Bitcoin mining into AI cloud.", valuation: "≈$13.0B equity / $14.7B EV (Jul. 27)", financialStatus: "Q1 AI Cloud Services revenue was $33.6M; lower scale, mixed business model, and share count up roughly 52% year over year.", sourceUrl: "https://stockanalysis.com/stocks/iren/statistics/" },
      { name: "Oracle", ticker: "ORCL", ownership: "Public", relationship: "Large general-purpose cloud competitor with AI infrastructure exposure and substantially broader software economics.", valuation: "≈$345B equity / $481B EV (Jul. 27)", financialStatus: "Profitable, diversified parent; much larger resources and debt capacity make its consolidated multiples non-comparable to CRWV.", sourceUrl: "https://stockanalysis.com/stocks/orcl/market-cap/" },
      { name: "Amazon Web Services", ticker: "AMZN", ownership: "Public", relationship: "General-purpose cloud competitor with custom silicon, global distribution, and a profitable cloud segment.", valuation: "AWS has no separately traded equity valuation", financialStatus: "AWS is reported within Amazon; parent scale and retail/advertising mix make AMZN valuation an imperfect CRWV comparison.", sourceUrl: "https://www.sec.gov/edgar/browse/?CIK=1018724&owner=exclude" },
      { name: "Microsoft Azure", ticker: "MSFT", ownership: "Public", relationship: "Both a significant CoreWeave customer and a much larger cloud competitor capable of internalizing workloads.", valuation: "Azure has no separately traded equity valuation", financialStatus: "Microsoft is highly profitable and diversified; consolidated valuation does not isolate Azure’s AI infrastructure economics.", sourceUrl: "https://www.sec.gov/edgar/browse/?CIK=789019&owner=exclude" },
      { name: "Lambda", ticker: "PRIVATE", ownership: "Private", relationship: "Specialized NVIDIA GPU cloud and prospective public-market competitor.", valuation: "Latest round valuation not disclosed; raised $1.5B+ Series E", financialStatus: "Private financial statements are unavailable; a May 2026 $1B credit facility shows continued capital intensity.", sourceUrl: "https://lambda.ai/blog/lambda-raises-over-1.5b-from-twg-global-usit-to-build-superintelligence-cloud-infrastructure" },
      { name: "Crusoe", ticker: "PRIVATE", ownership: "Private", relationship: "Vertically integrated AI factory developer and specialized cloud competitor.", valuation: ">$10B expected private valuation (Oct. 2025)", financialStatus: "Raised $1.375B in Series E financing; public revenue, profitability, debt, and cash-flow disclosures remain limited.", sourceUrl: "https://www.crusoe.ai/resources/newsroom/crusoe-announces-series-e-funding" },
    ],
    sources: [
      { title: "CoreWeave First-Quarter 2026 Form 10-Q", meta: "SEC filing · Filed May 7, 2026", href: "https://www.sec.gov/Archives/edgar/data/1769628/000176962826000222/crwv-20260331.htm", excerpt: "The filing reports $2.08B of Q1 revenue, a $740M net loss, $25.15B of principal debt, $2.24B of cash, $7.70B of property-and-equipment purchases, 65% revenue concentration among the top two customers, and the company’s material risk disclosures." },
      { title: "CoreWeave First-Quarter 2026 Results", meta: "Company results · May 7, 2026", href: "https://investors.coreweave.com/news/news-details/2026/CoreWeave-Reports-Strong-First-Quarter-2026-Results/", excerpt: "Management reported $99.4B of revenue backlog, more than 1 GW of active power, over 3.5 GW of contracted power, and new or expanded agreements with Meta, Anthropic, Cohere, Jane Street, and Mistral." },
      { title: "CoreWeave 2025 Form 10-K", meta: "SEC filing · Filed March 2, 2026", href: "https://www.sec.gov/Archives/edgar/data/1769628/000176962826000104/crwv-20251231.htm", excerpt: "The annual filing describes the platform, 2025 revenue of $5.13B, a $1.17B net loss, supplier and customer concentration, debt and lease obligations, competition, internal controls, and data-center delivery risks." },
      { title: "NVIDIA and CoreWeave expanded collaboration", meta: "SEC-filed company release · January 26, 2026", href: "https://www.sec.gov/Archives/edgar/data/1769628/000176962826000044/ex991pressrelease_final.htm", excerpt: "NVIDIA invested $2B at $87.20 per share and the companies expanded their technology alignment, including plans supporting more than 5 GW of AI factories by 2030." },
      { title: "$8.5B delayed-draw term-loan facility", meta: "SEC Form 8-K · March 31, 2026", href: "https://www.sec.gov/Archives/edgar/data/1769628/000176962826000129/crwv-20260330.htm", excerpt: "CoreWeave disclosed a new secured delayed-draw financing facility intended to fund equipment and infrastructure for contracted customer capacity." },
      { title: "$3.1B GPU-backed financing facility", meta: "SEC Form 8-K · May 18, 2026", href: "https://www.sec.gov/Archives/edgar/data/1769628/000176962826000236/crwv-20260515.htm", excerpt: "The filing describes another asset-backed financing structure tied to GPU infrastructure, illustrating how CoreWeave funds growth against contracted workloads and equipment collateral." },
      { title: "$3.5B senior-notes offering", meta: "SEC Form 8-K · June 11, 2026", href: "https://www.sec.gov/Archives/edgar/data/1769628/000176962826000278/crwv-20260611.htm", excerpt: "CoreWeave announced dollar- and euro-denominated senior notes due 2032, adding a significant post-quarter capital-markets transaction to the financing picture." },
      { title: "CoreWeave stock-price history", meta: "S&P Global Market Intelligence via StockAnalysis · Through July 31, 2026", href: "https://stockanalysis.com/stocks/crwv/history/", excerpt: "CRWV closed at $71.77 on July 31, 2026 versus $71.61 on December 31, 2025, while trading across a wide range during the year." },
      { title: "Second-quarter 2026 results date", meta: "Company announcement · July 27, 2026", href: "https://www.businesswire.com/news/home/20260727724365/en/CoreWeave-Announces-Date-of-Second-Quarter-2026-Financial-Results-and-Conference-Call", excerpt: "CoreWeave scheduled its second-quarter 2026 financial-results call for August 11, 2026 at 5:00 p.m. Eastern Time." },
    ],
  },
  CAT: {
    ticker: "CAT",
    description: "Heavy machinery, engines, energy systems, services, and equipment finance.",
    lede: "Caterpillar pairs a global installed base of mission-critical equipment with dealers, parts, services, technology, and financing.",
    sells: "Construction and mining equipment, diesel and natural-gas engines, industrial turbines, locomotives, parts, services, and financing.",
    revenueModel: "Equipment and engine sales plus aftermarket parts, services, rentals, digital offerings, and finance income.",
    opportunity: "Infrastructure, mining, energy, and replacement demand support equipment sales while the installed base drives recurring aftermarket activity.",
    mustGoRight: "Caterpillar must manage the cycle, preserve price discipline, support dealers, and grow services without sacrificing customer economics.",
    editorNote: "Caterpillar should be analyzed as both a cyclical manufacturer and an installed-base services franchise; the balance between those identities drives through-cycle quality.",
    bullTitle: "A global installed base with dealer reach",
    bull: ["A large field population creates recurring parts and service demand.", "Independent dealers provide local relationships and service capacity.", "Energy and mining exposure can diversify construction cycles."],
    bearTitle: "High-quality execution cannot remove cyclicality",
    bear: ["Construction and resource spending can decline sharply.", "Dealer inventory movements can amplify demand changes.", "Input costs, currency, and financing conditions affect customers and margins."],
    thesisBreaker: "Sustained erosion in dealer strength, installed-base economics, or aftermarket share would weaken Caterpillar’s principal advantages beyond an ordinary cycle.",
    financialDrivers: [{ label: "DEALER INVENTORY", value: "Cycle signal", detail: "End-user demand versus channel stocking" }, { label: "SERVICES", value: "Installed-base value", detail: "Parts, rebuilds, digital, and availability" }, { label: "PRICE / COST", value: "Margin discipline", detail: "Pricing, material, freight, and labor" }],
    risks: [{ title: "End-market cycle", level: "High", text: "Construction, mining, and energy capital spending can contract.", signal: "Retail sales and dealer inventory" }, { title: "Dealer health", level: "Medium", text: "Distribution quality depends on financially capable independent dealers.", signal: "Dealer liquidity and inventory aging" }, { title: "Global trade exposure", level: "Medium", text: "Tariffs, currency, supply chains, and local competition affect results.", signal: "Trade restrictions and regional price pressure" }],
    monitor: [{ title: "Services growth", text: "Measure how digital connectivity and rebuild activity deepen lifecycle value.", impact: "BULL CASE" }, { title: "Dealer inventory", text: "Distinguish end-user demand from channel stocking or destocking.", impact: "NEUTRAL" }],
    questions: ["How much earnings power is genuinely less cyclical?", "Can services outgrow the installed base?", "Where is dealer inventory most vulnerable?"],
    competitors: "Komatsu, Deere, Volvo Construction Equipment, Hitachi Construction Machinery, Cummins, and regional manufacturers.",
    sources: [{ title: "Caterpillar SEC filing library", meta: "SEC EDGAR · Primary source", href: "https://www.sec.gov/edgar/browse/?CIK=18230&owner=exclude", excerpt: "Caterpillar’s filings describe its machinery, energy and transportation, financial products, dealer network, cyclicality, and principal risks." }, { title: "Caterpillar Investor Relations", meta: "Company investor materials", href: "https://investors.caterpillar.com/", excerpt: "Official results, presentations, annual reports, SEC filings, and governance information published by Caterpillar." }],
  },
  BA: {
    ticker: "BA",
    description: "Commercial aircraft, defense systems, space programs, and global aviation services.",
    lede: "Boeing is one of the world’s two major large-commercial-aircraft manufacturers and also operates significant defense, space, and services businesses.",
    sells: "Commercial airplanes, military aircraft, satellites, weapons, space systems, spare parts, maintenance, training, and analytics.",
    revenueModel: "Aircraft and system deliveries, long-term development and production contracts, aftermarket parts, maintenance, and services.",
    opportunity: "A large installed base, substantial backlog, air-traffic growth, and strategic defense programs create long-duration demand.",
    mustGoRight: "Boeing must restore safety and production stability, improve supplier performance, execute fixed-price programs, and rebuild cash generation.",
    editorNote: "For Boeing, production quality and organizational discipline are the thesis. Backlog matters only if aircraft can be delivered safely, predictably, and profitably.",
    bullTitle: "Scarce strategic assets with long-duration demand",
    bull: ["The commercial-aircraft market has very high barriers to entry.", "Backlog and fleet replacement support long-term delivery demand.", "Services and defense provide additional installed-base and strategic value."],
    bearTitle: "Execution failures can overwhelm franchise value",
    bear: ["Quality and safety problems can slow production and damage trust.", "Fixed-price defense programs can generate large charges.", "A leveraged balance sheet reduces room for prolonged disruption."],
    thesisBreaker: "Failure to establish a durable safety and production system—rather than a temporary recovery—would impair customer trust, cash generation, and strategic value.",
    financialDrivers: [{ label: "DELIVERIES", value: "Cash conversion", detail: "Production stability, certification, and customer acceptance" }, { label: "BCA", value: "Program economics", detail: "787 and 737 production, rework, and pricing" }, { label: "DEFENSE", value: "Execution", detail: "Fixed-price development charges and milestones" }],
    risks: [{ title: "Safety and quality", level: "High", text: "Manufacturing control and product safety directly affect approvals, deliveries, and trust.", signal: "Regulatory findings and production holds" }, { title: "Balance sheet", level: "High", text: "Debt and cash needs constrain recovery flexibility.", signal: "Free cash flow and net debt" }, { title: "Defense program charges", level: "High", text: "Fixed-price development programs can require further cost recognition.", signal: "Quarterly reach-forward losses" }],
    monitor: [{ title: "Production stability", text: "Look beyond monthly volume to rework, traveled work, supplier quality, and delivery predictability.", impact: "BULL CASE" }, { title: "Regulatory oversight", text: "Treat findings and production constraints as core operating evidence.", impact: "BEAR CASE" }],
    questions: ["What evidence proves the safety culture has changed?", "When does delivery growth translate into durable cash flow?", "Which defense programs still carry asymmetric loss risk?"],
    competitors: "Airbus, Lockheed Martin, Northrop Grumman, RTX, General Dynamics, Embraer, and emerging aircraft manufacturers.",
    sources: [{ title: "Boeing SEC filing library", meta: "SEC EDGAR · Primary source", href: "https://www.sec.gov/edgar/browse/?CIK=12927&owner=exclude", excerpt: "Boeing’s filings describe its commercial, defense, space, and services businesses, backlog, debt, program accounting, safety, production, and contract risks." }, { title: "Boeing Investor Relations", meta: "Company investor materials", href: "https://investors.boeing.com/", excerpt: "Official results, presentations, SEC filings, annual reports, events, and governance information published by Boeing." }],
  },
  BB: {
    ticker: "BB",
    description: "Safety-certified embedded software, secure communications, cryptography, and connected-asset technology.",
    lede: "BlackBerry is now an infrastructure-software company centered on QNX embedded systems and Secure Communications rather than the handset business that made its name.",
    sells: "QNX operating systems, hypervisors, development tools, automotive middleware, secure communications, endpoint management, cryptography, and connected-asset services.",
    revenueModel: "Software licenses, support and maintenance, professional services, recurring subscriptions, volume-based QNX royalties, and intellectual-property licensing.",
    opportunity: "More software inside safety-critical vehicles and industrial systems can expand QNX design wins, royalty backlog, developer adoption, and lifecycle revenue.",
    mustGoRight: "QNX design wins must convert into production royalties, platform investment must keep pace with automotive architectures, and Secure Communications must remain relevant and cash generative.",
    editorNote: "The owner’s work is to separate design-win announcements and estimated royalty backlog from recognized revenue, production volumes, renewal economics, and cash conversion.",
    bullTitle: "A trusted operating layer for safety-critical systems",
    bull: ["QNX has a long operating history in embedded and safety-certified environments.", "Automotive software complexity can increase the value of operating systems, hypervisors, middleware, and development tools.", "Royalty-bearing designs can monetize over long vehicle production lives after development investment is incurred."],
    bearTitle: "Design wins are not the same as near-term revenue",
    bear: ["Automotive programs have long development cycles and production volumes can differ from customer forecasts.", "Open-source and large technology platforms compete for the embedded software layer.", "Secure Communications operates in mature, competitive markets and must fund continued product investment."],
    thesisBreaker: "A sustained failure of QNX design wins and royalty backlog to convert into growing, durable software revenue would break the embedded-platform thesis.",
    financialDrivers: [{ label: "QNX ROYALTIES", value: "Production conversion", detail: "Design wins, vehicle volumes, royalty rates, and timing" }, { label: "DEVELOPMENT SEATS", value: "Ecosystem reach", detail: "QNX SDP adoption, universities, tooling, and developer access" }, { label: "SECURE COMMS", value: "Recurring base", detail: "Retention, product relevance, and segment cash generation" }],
    risks: [{ title: "Automotive program timing", level: "High", text: "QNX royalty revenue depends on customer launches, unit production, and platform life cycles that BlackBerry does not control.", signal: "Royalty backlog conversion versus new design wins" }, { title: "Platform competition", level: "High", text: "Linux, Android-based systems, proprietary platforms, and competing embedded vendors can pressure adoption and pricing.", signal: "Design-win quality and software content per vehicle" }, { title: "Execution across two businesses", level: "Medium", text: "QNX and Secure Communications have different customers, economics, and investment needs.", signal: "Segment growth, margins, and operating expense discipline" }],
    monitor: [{ title: "Royalty backlog conversion", text: "Reconcile estimated future royalties with recognized QNX revenue and vehicle production evidence.", impact: "BULL CASE" }, { title: "Automotive architecture changes", text: "Track whether centralized compute expands or commoditizes QNX content.", impact: "NEUTRAL" }, { title: "Secure Communications retention", text: "Watch recurring revenue stability as the portfolio is focused and simplified.", impact: "BEAR CASE" }],
    questions: ["How much QNX backlog converts within three years?", "Is software content per vehicle rising faster than pricing pressure?", "What is the durable role of Secure Communications in the combined company?"],
    competitors: "Wind River, Green Hills Software, Linux and Android ecosystems, Elektrobit, automotive OEM software stacks, Microsoft, and security-platform vendors.",
    sources: [{ title: "BlackBerry 2026 Form 10-K", meta: "SEC filing · Filed April 9, 2026", href: "https://www.sec.gov/Archives/edgar/data/1070235/000107023526000039/bbry-20260228.htm", excerpt: "The filing describes QNX and Secure Communications products, licensing and royalty models, segment results, QNX royalty backlog, competition, and customer-program risks." }, { title: "BlackBerry Investor Relations", meta: "Company primary materials", href: "https://www.blackberry.com/ca/en/company/investors", excerpt: "Official results, annual reports, SEC filings, presentations, and investor updates published by BlackBerry." }],
  },
  BE: {
    ticker: "BE",
    description: "Onsite solid-oxide power generation and electrolysis systems for resilient distributed energy.",
    lede: "Bloom Energy builds modular solid-oxide systems that generate electricity onsite, targeting customers constrained by grid availability, reliability requirements, or time-to-power needs.",
    sells: "Bloom Energy Server systems, installation, operations and maintenance, electricity under legacy arrangements, and solid-oxide electrolyzer systems.",
    revenueModel: "Equipment and installation revenue, service agreements, electricity revenue, and selected financed or partner-supported project structures.",
    opportunity: "Power demand from AI infrastructure and other critical loads may value speed, modularity, availability, and onsite generation while grid interconnections remain constrained.",
    mustGoRight: "Manufacturing must scale with acceptable quality, large orders must convert into profitable deployments, service obligations must remain controlled, and customers must accept fuel and emissions tradeoffs.",
    editorNote: "Bloom should be judged project by project: backlog quality, customer concentration, product gross margin, installation timing, service costs, fuel economics, and cash collection determine whether demand becomes owner value.",
    bullTitle: "Time-to-power can be economically valuable",
    bull: ["Modular onsite generation can be installed incrementally without waiting for major transmission expansion.", "High availability and load-following characteristics fit critical data-center requirements.", "A common solid-oxide platform supports power generation, hydrogen pathways, and manufacturing leverage."],
    bearTitle: "Project growth carries concentration and execution risk",
    bear: ["Large customer and partner agreements can make revenue timing uneven.", "Natural-gas reliance, tariffs, permitting, and incentive rules affect project economics.", "Warranty, service, installation, and manufacturing performance can consume expected equipment margin."],
    thesisBreaker: "If large deployments fail to produce durable positive gross profit and operating cash flow after service and warranty obligations, demand growth alone would not validate the thesis.",
    financialDrivers: [{ label: "PRODUCT", value: "Deployment volume", detail: "Acceptances, system pricing, mix, and manufacturing cost" }, { label: "SERVICE", value: "Lifecycle economics", detail: "Fleet performance, maintenance, replacement, and warranty" }, { label: "AI POWER", value: "Time-to-power", detail: "Data-center awards, delivery schedules, and utility constraints" }],
    risks: [{ title: "Customer concentration", level: "High", text: "A limited number of large projects or partners can materially affect reported results and working capital.", signal: "Top-customer share, backlog concentration, and acceptance timing" }, { title: "Fuel and policy exposure", level: "High", text: "Natural-gas availability, interconnection rules, emissions policy, incentives, and tariffs shape customer economics.", signal: "Project cancellations, permitting changes, or incentive reductions" }, { title: "Service and warranty cost", level: "High", text: "Long-lived systems create maintenance and performance obligations after initial installation.", signal: "Service gross margin and warranty accrual trends" }],
    monitor: [{ title: "AI infrastructure conversion", text: "Track signed capacity through manufacturing, installation, acceptance, and cash receipt.", impact: "BULL CASE" }, { title: "Product and service margins", text: "Separate equipment margin improvement from lifecycle service obligations.", impact: "NEUTRAL" }, { title: "Fuel and permitting constraints", text: "Watch whether local rules slow or prevent proposed deployments.", impact: "BEAR CASE" }],
    questions: ["What return does Bloom earn across equipment plus lifetime service?", "How concentrated is executable backlog?", "Which customers value speed enough to absorb fuel and emissions costs?"],
    competitors: "Electric utilities, gas reciprocating engines, small and combined-cycle turbines, fuel-cell vendors, solar-plus-storage, microgrid integrators, and emerging onsite nuclear systems.",
    sources: [{ title: "Bloom Energy 2025 Form 10-K", meta: "SEC filing · Filed February 2026", href: "https://www.sec.gov/Archives/edgar/data/1664703/000162828026006516/be-20251231.htm", excerpt: "The filing describes Energy Server capabilities, manufacturing, purchase alternatives, service obligations, competition, fuel requirements, customer exposure, and regulatory risks." }, { title: "Bloom Energy Investor Relations", meta: "Company primary materials", href: "https://investor.bloomenergy.com/", excerpt: "Official financial results, SEC filings, presentations, events, and governance information published by Bloom Energy." }],
  },
  RKLB: {
    ticker: "RKLB",
    description: "Launch services, spacecraft, satellite components, and space-mission systems.",
    lede: "Rocket Lab combines the flight-proven Electron launch vehicle with a growing Space Systems portfolio and the capital-intensive development of the larger Neutron rocket.",
    sells: "Electron and HASTE launches, spacecraft design and manufacturing, satellite components, mission operations, separation systems, solar products, flight software, and future Neutron launch capacity.",
    revenueModel: "Launch contracts recognized around missions plus product and long-term contract revenue from spacecraft, components, and space systems services.",
    opportunity: "A vertically integrated supplier can capture more mission value across launch, spacecraft, components, and operations while government and commercial demand for resilient space architectures grows.",
    mustGoRight: "Electron reliability must remain high, Space Systems programs must execute profitably, Neutron must reach service without exhausting financial capacity, and launch cadence must scale safely.",
    editorNote: "The existing business and the Neutron option should be valued separately: current segment economics provide evidence, while schedule, cost, and demand assumptions dominate the new-launch thesis.",
    bullTitle: "More than a small-launch company",
    bull: ["Electron has established flight heritage and a repeat customer base.", "Space Systems supplies components and spacecraft regardless of which rocket launches them.", "Neutron could expand addressable missions and support an integrated launch-and-spacecraft offering."],
    bearTitle: "Space hardware compounds technical and capital risk",
    bear: ["A launch failure can halt cadence, increase cost, and damage customer trust.", "Neutron development requires substantial capital before commercial economics are proven.", "Government programs and complex spacecraft contracts can shift schedule, scope, and margin."],
    thesisBreaker: "A loss of Electron reliability combined with prolonged Neutron delay and weak Space Systems contract economics would undermine the integrated-space-platform thesis.",
    financialDrivers: [{ label: "ELECTRON", value: "Launch cadence", detail: "Missions, reliability, pricing, and range availability" }, { label: "SPACE SYSTEMS", value: "Program execution", detail: "Backlog conversion, component mix, milestones, and gross profit" }, { label: "NEUTRON", value: "Development option", detail: "Schedule, testing, capital needs, and customer commitments" }],
    risks: [{ title: "Launch reliability", level: "High", text: "Launch vehicles can fail despite extensive testing, affecting schedule, cost, insurance, and reputation.", signal: "Mission anomalies, investigation duration, and return-to-flight evidence" }, { title: "Neutron development", level: "High", text: "A new launch system requires significant engineering, infrastructure, testing, and capital before revenue.", signal: "Engine, stage, pad, and integrated-test milestones versus spending" }, { title: "Contract execution", level: "High", text: "Spacecraft and government programs can carry fixed-price, supply-chain, and milestone risk.", signal: "Backlog revisions and Space Systems gross margin" }],
    monitor: [{ title: "Electron cadence and reliability", text: "Track completed missions, turnaround, pricing, and customer mix.", impact: "BULL CASE" }, { title: "Space Systems margin", text: "Compare segment growth with contract profitability and cash conversion.", impact: "NEUTRAL" }, { title: "Neutron critical path", text: "Demand physical test evidence rather than relying only on target dates.", impact: "BEAR CASE" }],
    questions: ["What normalized margin can Electron earn at higher cadence?", "Which Space Systems products have repeatable rather than program-specific economics?", "What remaining capital and technical milestones precede Neutron revenue?"],
    competitors: "SpaceX, Firefly Aerospace, United Launch Alliance, Arianespace, Northrop Grumman, satellite component suppliers, and spacecraft prime contractors.",
    sources: [{ title: "Rocket Lab 2025 Form 10-K", meta: "SEC filing · Filed February 26, 2026", href: "https://www.sec.gov/Archives/edgar/data/1819994/000181999426000013/rklb-20251231.htm", excerpt: "The filing describes Electron, HASTE, Neutron development, Space Systems products, segment revenue, government customers, backlog, launch risk, and capital requirements." }, { title: "Rocket Lab Investor Relations", meta: "Company primary materials", href: "https://investors.rocketlabusa.com/", excerpt: "Official financial results, mission updates, SEC filings, presentations, and governance information published by Rocket Lab." }],
  },
  PLTR: {
    ticker: "PLTR",
    description: "Data integration and operational software for governments and commercial organizations.",
    lede: "Palantir’s Gotham, Foundry, Apollo, and AIP platforms connect data, logic, models, and operational decisions across complex customer environments.",
    sells: "Gotham for government and defense operations, Foundry for enterprise data operations, Apollo for software deployment, and AIP for governed use of artificial intelligence in workflows.",
    revenueModel: "Multi-period software contracts, subscriptions, platform access, cloud or on-premise deployment, support, and implementation-related services.",
    opportunity: "Organizations seeking to operationalize AI need governed data, permissions, models, and workflows rather than standalone demonstrations, expanding the potential value of Palantir’s Ontology-centered platforms.",
    mustGoRight: "AIP adoption must convert into durable production contracts, commercial growth must broaden beyond early cohorts, and deployment economics must scale without customer concentration or excessive customization.",
    editorNote: "The key distinction is between rapid pilot activity and expanding, recurring production value. Contract growth, remaining deal value, customer count, concentration, margins, and stock-based compensation must be read together.",
    bullTitle: "AI connected to real operating decisions",
    bull: ["Ontology links data and models to the objects and actions customers operate.", "Gotham has deep use across defense and intelligence missions where reliability matters.", "AIP can accelerate adoption across both government and commercial customers using the existing platform foundation."],
    bearTitle: "High expectations magnify every execution question",
    bear: ["Large government and enterprise contracts can have long, uncertain sales cycles.", "Customer concentration and contract timing can make growth uneven.", "Cloud vendors, data platforms, consultants, and in-house teams compete for AI and analytics workloads."],
    thesisBreaker: "If AIP pilots do not expand into durable production revenue while customer additions and remaining contract value weaken, the platform-growth thesis would require reassessment.",
    financialDrivers: [{ label: "U.S. COMMERCIAL", value: "Expansion", detail: "New customers, cohort growth, AIP conversion, and deal duration" }, { label: "GOVERNMENT", value: "Mission depth", detail: "Awards, renewals, program timing, and allied adoption" }, { label: "OPERATING LEVERAGE", value: "Software economics", detail: "Gross margin, sales efficiency, cash flow, and dilution" }],
    risks: [{ title: "Contract concentration and timing", level: "High", text: "A limited number of large customers and government procurement decisions can affect periods materially.", signal: "Top-customer share, remaining deal value, and award timing" }, { title: "Competitive platform market", level: "High", text: "Customers can combine cloud, data, AI, consulting, and internally developed alternatives.", signal: "Expansion rates and competitive losses" }, { title: "Security and mission sensitivity", level: "High", text: "Failures in security, privacy, availability, or responsible AI controls could impair trust and access.", signal: "Material incidents, contract restrictions, or accreditation delays" }],
    monitor: [{ title: "AIP production conversion", text: "Track contracts and expansion following bootcamps and pilots.", impact: "BULL CASE" }, { title: "Commercial breadth", text: "Measure whether growth is distributed across more customers and industries.", impact: "NEUTRAL" }, { title: "Government award timing", text: "Separate durable program position from quarterly procurement volatility.", impact: "BEAR CASE" }],
    questions: ["What proportion of AIP activity becomes recurring production use?", "How much growth comes from expansion versus new logos?", "Can sales efficiency improve while deployments remain deeply operational?"],
    competitors: "Microsoft, Amazon Web Services, Google Cloud, Snowflake, Databricks, Salesforce, defense software vendors, systems integrators, and internal development teams.",
    sources: [{ title: "Palantir 2025 Form 10-K", meta: "SEC filing · Filed February 17, 2026", href: "https://www.sec.gov/Archives/edgar/data/1321655/000132165526000011/pltr-20251231.htm", excerpt: "The filing describes Gotham, Foundry, Apollo, AIP, Ontology, government and commercial customers, contract economics, competition, security, and operating risks." }, { title: "Palantir Investor Relations", meta: "Company primary materials", href: "https://investors.palantir.com/", excerpt: "Official shareholder letters, results, presentations, SEC filings, events, and governance information published by Palantir." }],
  },
  TSLA: {
    ticker: "TSLA",
    description: "Electric vehicles, energy storage and generation, charging, software, and physical-AI development.",
    lede: "Tesla combines scaled electric-vehicle manufacturing with energy storage, charging, software, autonomy development, and newer physical-AI ambitions including Robotaxi and Optimus.",
    sells: "Electric vehicles, automotive regulatory credits, used vehicles, charging, insurance and service, energy storage systems, solar products, software features, connectivity, and related services.",
    revenueModel: "Vehicle and energy-product sales and leasing, services, charging, software and connectivity, insurance, used vehicles, and regulatory credits.",
    opportunity: "Manufacturing scale, a large connected fleet, energy storage growth, charging infrastructure, and real-world AI data may support businesses beyond one-time vehicle sales.",
    mustGoRight: "Core automotive economics must remain competitive while Tesla funds autonomy, Robotaxi, energy, manufacturing, and robotics; regulatory approval and product safety must follow technical progress.",
    editorNote: "Tesla contains several businesses at different evidence stages. Vehicle and energy results are reported operations; Robotaxi, unsupervised autonomy, and Optimus require separate milestone and probability tracking.",
    bullTitle: "A manufacturing and data platform with multiple options",
    bull: ["Vehicle, battery, power electronics, software, and manufacturing are developed as an integrated system.", "Energy storage can diversify growth beyond automotive demand.", "A large connected fleet may support iterative software and autonomy development if safety and regulation permit."],
    bearTitle: "Future options can distract from present economics",
    bear: ["Automotive demand is cyclical and intensely price competitive.", "Autonomy and robotics outcomes depend on technical performance, safety, regulation, and public acceptance.", "Factories, AI infrastructure, service capacity, and new products require large capital commitments."],
    thesisBreaker: "Sustained deterioration in automotive and energy cash economics without independently verified progress toward profitable autonomy or robotics would weaken the integrated physical-AI thesis.",
    financialDrivers: [{ label: "AUTOMOTIVE", value: "Volume and margin", detail: "Deliveries, pricing, mix, incentives, warranty, and factory utilization" }, { label: "ENERGY", value: "Storage scale", detail: "Deployments, pricing, supply, gross margin, and service" }, { label: "PHYSICAL AI", value: "Milestone evidence", detail: "Safety, autonomy, utilization, approvals, and commercial economics" }],
    risks: [{ title: "Demand and pricing", level: "High", text: "Vehicle demand, incentives, interest rates, competition, and product mix can pressure utilization and margin.", signal: "Orders, deliveries, inventory, incentives, and automotive gross margin" }, { title: "Autonomy safety and regulation", level: "High", text: "Commercial deployment depends on demonstrated safety, approvals, liability frameworks, and customer acceptance.", signal: "Independent safety evidence, disengagement context, and operating permits" }, { title: "Capital allocation", level: "High", text: "Multiple factories, compute, charging, batteries, vehicles, energy products, and robotics compete for capital.", signal: "Capital spending versus incremental cash returns" }],
    monitor: [{ title: "Core vehicle economics", text: "Track price, mix, utilization, warranty, and cash generation before autonomy assumptions.", impact: "NEUTRAL" }, { title: "Energy storage conversion", text: "Measure deployments, margins, supply, and repeat customer demand.", impact: "BULL CASE" }, { title: "Autonomy milestone quality", text: "Require operational, safety, regulatory, and unit-economic evidence.", impact: "BEAR CASE" }],
    questions: ["What are normalized automotive margins without regulatory credits?", "How durable are energy-storage margins as competition scales?", "Which autonomy milestones are independently verifiable and economically material?"],
    competitors: "BYD, Volkswagen Group, General Motors, Ford, Hyundai Motor Group, Chinese EV manufacturers, autonomous-driving developers, battery-storage suppliers, utilities, and distributed-energy providers.",
    sources: [{ title: "Tesla 2025 Form 10-K", meta: "SEC filing · Filed January 28, 2026", href: "https://www.sec.gov/Archives/edgar/data/1318605/000162828026003952/tsla-20251231.htm", excerpt: "The filing describes Tesla’s automotive and energy businesses, physical-AI strategy, manufacturing, capital requirements, competition, supply chain, regulation, and risk factors." }, { title: "Tesla Investor Relations", meta: "Company primary materials", href: "https://ir.tesla.com/", excerpt: "Official quarterly disclosures, shareholder decks, webcasts, production and delivery releases, SEC filings, and annual reports published by Tesla." }],
  },
  AMC: {
    ticker: "AMC",
    reviewed: "August 1, 2026",
    completeness: 100,
    newsroomUrl: "https://investor.amctheatres.com/news-events/press-releases",
    newsroomFeedUrl: "https://investor.amctheatres.com/news-events/press-releases/rss",
    description: "Theatrical exhibition across the United States and Europe, with admissions, food and beverage, premium formats, loyalty, advertising, and other theatre revenue.",
    lede: "AMC is a high-fixed-cost theatrical exhibition network whose owner economics depend on the film slate, attendance, per-patron spending, studio film-rental terms, theatre productivity, interest expense, and the number of shares over which any recovery is spread.",
    sells: "Movie admissions; premium large-format, recliner, dine-in, and subscription experiences; food and beverage; ticketing; advertising; theatre rentals; gift products; and selected alternative programming across U.S. and European theatres.",
    revenueModel: "Admissions revenue is shared with film distributors through film-exhibition costs. AMC retains food-and-beverage and other theatre revenue after related operating costs, while a large theatre, lease, labor, and interest-cost base creates substantial operating leverage in both directions.",
    opportunity: "A steadier theatrical release slate, premium-format mix, loyalty participation, higher food-and-beverage conversion, disciplined theatre pruning, and alternative content can raise revenue per patron and improve the productivity of AMC’s existing footprint.",
    mustGoRight: "Industry box office and AMC attendance must normalize, per-patron economics must remain resilient, theatre-level profit must cover rent and interest, and management must improve the balance sheet without transferring most of the recovery to new creditors or newly issued shares.",
    editorNote: "AMC’s June 2026 quarter showed the operating leverage in the model: attendance rose 13.5%, total revenue rose 14.2% to $1.60 billion, adjusted EBITDA reached $321.4 million, and food and beverage per patron reached $8.08. AMC closed at $2.82 on July 31 versus $1.61 on January 2, a 75.2% YTD price gain. The same filing documents major equity issuance, so owners must analyze enterprise recovery and per-share recovery separately.",
    bullTitle: "A scarce global cinema platform with recovery leverage",
    bull: [
      "A large U.S. and European footprint gives AMC broad access to improving film supply and event programming without rebuilding the network.",
      "Premium formats, recliners, loyalty, subscription, and food-and-beverage initiatives can deepen engagement and lift revenue per visit.",
      "High fixed costs can create meaningful incremental profit when attendance and theatre productivity rise above the break-even level.",
    ],
    bearTitle: "The capital structure can absorb the operating recovery",
    bear: [
      "Studio release timing and film popularity remain outside AMC’s control, while streaming and other leisure choices compete for time and spending.",
      "Debt, leases, interest, maintenance, and working-capital needs leave little room for a weak slate or execution setback.",
      "Repeated common-stock issuance and securities exchangeable into equity can improve liquidity while materially diluting each existing share’s claim on future value.",
    ],
    thesisBreaker: "If a normalized film slate and higher attendance do not produce sustained positive free cash flow before financing, or if balance-sheet repair requires continuing dilution faster than enterprise value improves, the common-equity recovery thesis breaks.",
    financialDrivers: [
      { label: "ATTENDANCE", value: "Slate conversion", detail: "Box office, patron counts, premium-format mix, market share, and theatre productivity" },
      { label: "PER PATRON", value: "Visit economics", detail: "Average ticket price, film-rental rate, food and beverage per patron, and other theatre revenue" },
      { label: "CAPITAL STRUCTURE", value: "Per-share outcome", detail: "Cash generation, interest, maturities, lease obligations, share issuance, and fully diluted share count" },
    ],
    risks: [
      { title: "Film supply and attendance", level: "High", text: "Revenue depends on the quantity, timing, and commercial appeal of films supplied by distributors; production disruptions and changing release strategies can leave the fixed theatre base underutilized.", signal: "Domestic and international box office, AMC attendance, and admissions revenue versus industry results" },
      { title: "Leverage and liquidity", level: "High", text: "Debt service, leases, capital needs, and a historically volatile cash profile can force refinancing or capital raising before the operating thesis matures.", signal: "Operating cash flow, free cash flow, cash balance, interest expense, maturities, and covenant headroom" },
      { title: "Equity dilution", level: "High", text: "At-the-market sales, registered offerings, exchangeable securities, and equity-settled obligations can expand liquidity but reduce each existing share’s ownership percentage.", signal: "Basic and fully diluted shares, equity proceeds per share, and debt retired per share issued" },
    ],
    monitor: [
      { title: "Film slate into attendance", text: "Compare industry box office with AMC patron growth and theatre productivity; a strong slate only matters if AMC converts it efficiently.", impact: "BULL CASE" },
      { title: "Contribution per patron", text: "Track ticket price and film rent alongside food and beverage per patron, premium-format mix, and other theatre revenue.", impact: "NEUTRAL" },
      { title: "Enterprise value versus share count", text: "Maintain a bridge from cash generation and debt reduction to the fully diluted common-share count after every financing transaction.", impact: "BEAR CASE" },
    ],
    questions: [
      "What annual attendance and contribution per patron are required to cover cash interest, leases, and maintenance capital spending?",
      "How much of an industry box-office recovery is AMC retaining after film rent and theatre operating costs?",
      "Is each financing transaction increasing or decreasing value per fully diluted share?",
      "Which theatres and premium formats earn attractive four-wall returns after required reinvestment?",
    ],
    competitors: "Cinemark, Regal and other cinema operators, independent theatres, premium home entertainment, streaming services, gaming, live events, and other out-of-home leisure spending.",
    performance: {
      label: "2026 YTD share-price return",
      value: "+75.2%",
      asOf: "January 2–July 31, 2026 · $1.61 to $2.82",
      detail: "Price performance—not a recommendation. The July rally followed record second-quarter revenue and adjusted EBITDA, but the per-share outcome also reflects financing, dilution, sentiment, and market positioning.",
      drivers: [
        { title: "A stronger film slate converted into attendance", detail: "Second-quarter attendance increased 13.5% year over year and revenue increased 14.2% to $1.60 billion. AMC attributed the improvement primarily to more popular film releases.", sourceUrl: "https://www.sec.gov/Archives/edgar/data/1411579/000141157926000059/amc-20260630x10q.htm" },
        { title: "Operating leverage finally showed through", detail: "Q2 adjusted EBITDA rose to a company-record $321.4 million from $189.5 million, while the company reported $190.1 million of free cash flow for the quarter.", sourceUrl: "https://investor.amctheatres.com/financial-information/financial-results" },
        { title: "Premium experiences support visit economics", detail: "At June 30, AMC reported 226 IMAX screens, 182 Dolby Cinema screens, and 161 in-house premium large-format screens. Premium mix, pricing, loyalty, and food-and-beverage conversion can lift revenue per visit.", sourceUrl: "https://www.sec.gov/Archives/edgar/data/1411579/000141157926000059/amc-20260630x10q.htm" },
        { title: "Near-term debt maturities were pushed out", detail: "AMC refinanced $400 million of Odeon debt to 2031 and used a June equity offering to redeem $125.5 million of 2027 notes, reducing annual cash interest by about $7.7 million. The trade-off was additional common-share dilution.", sourceUrl: "https://investor.amctheatres.com/sec-filings/all-sec-filings/content/0001104659-26-077513/tm2618471d2_ex99-1.htm" },
      ],
    },
    comparables: [
      { name: "Cinemark Holdings", ticker: "CNK", ownership: "Public", relationship: "Closest U.S. listed theatrical-exhibitor comparable", valuation: "Approx. $3.9B equity value / $6.6B enterprise value (late July 2026)", financialStatus: "Profitable and cash-generative with a materially stronger balance-sheet profile; the cleanest public benchmark for AMC’s theatre productivity and leverage.", sourceUrl: "https://www.sec.gov/Archives/edgar/data/885975/000119312526056015/cnk-20251231.htm" },
      { name: "Cineplex", ticker: "TSX: CGX", ownership: "Public", relationship: "Canadian exhibitor and location-based entertainment operator", valuation: "Approx. C$0.73B equity value / C$2.43B enterprise value (July 2026)", financialStatus: "A leveraged regional exhibitor; useful for comparing premium formats, concessions, loyalty, and the gap between equity and enterprise value.", sourceUrl: "https://www.cineplex.com/investors" },
      { name: "The Marcus Corporation", ticker: "MCS", ownership: "Public", relationship: "Regional U.S. exhibitor with a separate hotel business", valuation: "Approx. $0.75B equity value / $1.06B enterprise value (July 2026)", financialStatus: "Smaller and more diversified than AMC; theatre comparisons require separating Marcus Hotels & Resorts from Marcus Theatres.", sourceUrl: "https://ir.marcuscorp.com/" },
      { name: "IMAX Corporation", ticker: "IMAX", ownership: "Public", relationship: "Premium-format technology partner and adjacent economics benchmark", valuation: "Approx. $2.2B equity value / $2.3B enterprise value (July 2026)", financialStatus: "Asset-lighter than an exhibitor. AMC was the largest U.S. IMAX exhibitor in 2025, so IMAX is both a supplier/partner and a read-through on premium demand—not a direct like-for-like peer.", sourceUrl: "https://www.sec.gov/edgar/browse/?CIK=921582&owner=exclude" },
      { name: "Regal Cineworld Group", ticker: "—", ownership: "Private", relationship: "Large direct competitor in the U.S. and Europe", valuation: "No current public equity valuation", financialStatus: "Privately controlled by former lenders after Chapter 11; post-restructuring disclosures are less complete than public-company filings.", sourceUrl: "https://www.regalcineworld.com/" },
      { name: "Alamo Drafthouse", ticker: "—", ownership: "Private", relationship: "Premium dine-in theatrical competitor", valuation: "Private subsidiary; standalone valuation not disclosed", financialStatus: "Owned by Sony Pictures Entertainment. Strategically relevant for differentiated programming, dine-in service, and premium guest experience rather than scale.", sourceUrl: "https://drafthouse.com/" },
    ],
    sources: [
      { title: "AMC Entertainment 2025 Form 10-K", meta: "SEC filing · Filed February 23, 2026", href: "https://www.sec.gov/Archives/edgar/data/1411579/000141157926000016/amc-20251231x10k.htm", excerpt: "The annual filing describes AMC’s U.S. and International theatrical exhibition segments, admissions and food-and-beverage model, film exhibition costs, theatre concepts, debt, leases, competition, liquidity, and risk factors." },
      { title: "AMC 2026 Financial Results", meta: "Company primary materials · Q2 2026 release, webcast, and filing links", href: "https://investor.amctheatres.com/financial-information/financial-results", excerpt: "AMC’s official results page links the June 2026 earnings release, webcast audio, Form 10-Q, and XBRL package, alongside prior quarterly and annual materials." },
      { title: "AMC Second-Quarter 2026 Form 10-Q", meta: "SEC filing · Filed July 23, 2026", href: "https://www.sec.gov/Archives/edgar/data/1411579/000141157926000059/amc-20260630x10q.htm", excerpt: "The filing reports June-quarter attendance, admissions, food and beverage, other theatre revenue, cash, financing activity, segment results, liquidity language, debt, leases, and share issuance." },
      { title: "AMC Investor Relations", meta: "Company primary materials", href: "https://investor.amctheatres.com/", excerpt: "Official earnings materials, SEC filings, presentations, events, governance information, and shareholder communications published by AMC." },
      { title: "AMC historical stock prices", meta: "Market data · Through July 31, 2026", href: "https://stockanalysis.com/stocks/amc/history/", excerpt: "AMC closed at $1.61 on January 2, 2026 and $2.82 on July 31, 2026, a 75.2% price increase. Market prices can change rapidly and do not establish intrinsic value." },
      { title: "AMC June 2026 financing announcement", meta: "Company primary material · June 25, 2026", href: "https://investor.amctheatres.com/sec-filings/all-sec-filings/content/0001104659-26-077513/tm2618471d2_ex99-1.htm", excerpt: "AMC said the equity offering would fund redemption of $125.5 million of 2027 notes, lower annual cash interest by about $7.7 million, strengthen cash reserves, and fund selected theatre investments." },
    ],
  },
  ORCL: {
    ticker: "ORCL",
    reviewed: "August 1, 2026",
    completeness: 100,
    newsroomUrl: "https://investor.oracle.com/investor-news/",
    description: "Enterprise applications, database technology, cloud infrastructure, support, hardware, and services delivered across public cloud, multicloud, hybrid, and on-premises environments.",
    lede: "Oracle is using its durable database, applications, and support franchise to finance a much more capital-intensive AI cloud expansion. The ownership question is whether rapidly growing OCI demand and a $638 billion remaining performance obligation can produce returns above the cost of data centers, debt, leases, and potential equity dilution.",
    sells: "Oracle Cloud Infrastructure compute, storage, networking, databases, and AI services; Fusion Cloud applications for ERP, HCM, supply chain, and customer experience; NetSuite; Oracle Health; database, Java, MySQL, and middleware software; support, licenses, engineered systems, hardware, and consulting services.",
    revenueModel: "Cloud arrangements generally run one to five years and are recognized ratably or as usage occurs. Software support is primarily recurring, licenses are generally recognized when control transfers, and hardware and services are recognized as products and work are delivered.",
    opportunity: "AI training and inference, multicloud database deployment, sovereign and regulated cloud demand, and Oracle’s installed base can expand OCI usage while creating cross-sell opportunities across database, applications, and industry products.",
    mustGoRight: "Oracle must deliver contracted data-center capacity on schedule, convert backlog into high-utilization revenue, preserve database and applications relevance, obtain scarce power and accelerators, and earn returns above rising interest, lease, depreciation, and financing costs.",
    editorNote: "Fiscal 2026 revenue increased 17% to $67.36 billion, OCI revenue increased 77% to $18.10 billion, and RPO reached $638 billion. That growth required $55.66 billion of capital expenditures against $31.98 billion of operating cash flow, producing company-reported free cash flow of negative $23.69 billion. At year end, Oracle reported $31.29 billion of cash, $129.54 billion of current and long-term debt, and approximately $260 billion of additional lease commitments—substantially all for data centers not yet commenced.",
    bullTitle: "A durable software franchise is becoming an AI infrastructure platform",
    bull: [
      "Cloud and software represented 87% of fiscal 2026 revenue, providing a large installed base and recurring revenue foundation for the cloud buildout.",
      "OCI revenue increased 77% to $18.10 billion in fiscal 2026, while total cloud revenue increased 39% to $33.99 billion.",
      "RPO reached $638 billion; Oracle said $75 billion of that balance related to customer-prepaid or customer-supplied GPU portions, which can reduce part of the funding burden.",
      "Oracle can place its databases across OCI, customer data centers, and competing clouds while cross-selling applications, infrastructure, and industry products.",
    ],
    bearTitle: "The backlog carries a historic capital and financing obligation",
    bear: [
      "Fiscal 2026 capital expenditures of $55.66 billion exceeded operating cash flow by $23.69 billion, and management expects the infrastructure program to require additional debt and equity financing.",
      "Current and long-term debt reached $129.54 billion, fiscal 2026 interest expense was $4.60 billion, and roughly $260 billion of additional lease commitments had not yet commenced at year end.",
      "RPO is not recognized revenue and depends on Oracle delivering capacity, customers performing under contracts, service availability, pricing, utilization, and the economics of each arrangement.",
      "AWS, Microsoft Azure, Google Cloud, enterprise-software competitors, customer-built systems, and open-source technologies compete for workloads while Oracle’s fiscal 2026 software revenue declined 1%.",
    ],
    thesisBreaker: "If Oracle’s record backlog fails to convert into cash returns above its cost of capital while debt, lease obligations, capital spending, and share issuance continue to expand, the AI cloud transformation would not be creating sufficient value for owners.",
    financialDrivers: [
      { label: "FY2026 REVENUE", value: "$67.36B · +17%", detail: "Cloud, software, hardware, and services; compare reported growth with organic demand and acquisition effects" },
      { label: "CLOUD / OCI", value: "$33.99B / $18.10B", detail: "Fiscal 2026 growth of 39% for cloud and 77% for OCI; monitor usage, mix, and operating economics" },
      { label: "RPO", value: "$638B", detail: "Contracted future revenue subject to delivery, timing, performance, and cancellation terms; $75B involved prepaid or customer-supplied GPUs" },
      { label: "CASH GENERATION", value: "$31.98B OCF", detail: "$55.66B capital expenditures produced company-reported free cash flow of negative $23.69B" },
      { label: "LIQUIDITY / DEBT", value: "$31.29B / $129.54B", detail: "Year-end cash and cash equivalents versus current and long-term borrowings; fiscal 2026 interest expense was $4.60B" },
      { label: "FUTURE LEASES", value: "≈$260B", detail: "Additional commitments, substantially all for data centers expected to commence mainly in fiscal 2027–2029, generally for 15–19 years" },
    ],
    risks: [
      { title: "Data-center delivery and capital intensity", level: "High", text: "AI cloud contracts require power, land, advanced accelerators, networking, construction, and reliable operations before much of the revenue can be recognized. Delays or underutilization can reduce returns while capital costs remain.", signal: "Capacity delivered versus schedule, OCI growth, property and equipment, capital expenditures, depreciation, utilization, and operating cash flow" },
      { title: "Debt, leases, and equity financing", level: "High", text: "Oracle’s buildout is being funded with operating cash flow, debt, customer funding, leases, and equity. Higher rates, refinancing needs, rating pressure, or dilution can weaken per-share economics.", signal: "Net debt, interest expense, lease commencements, debt maturities, equity issuance, free cash flow, and financing guidance" },
      { title: "Backlog conversion and customer economics", level: "High", text: "The $638 billion RPO is a contractual indicator, not guaranteed profit. Large AI arrangements may concentrate incremental growth and require substantial dedicated capacity or customer-furnished hardware.", signal: "RPO conversion, disclosed customer funding, revenue concentration, contract modifications, service credits, and cash collections" },
      { title: "Technology and competitive transitions", level: "High", text: "Oracle competes across infrastructure, databases, applications, healthcare technology, and open-source alternatives. Customers can use rival clouds, develop internal systems, or shift workloads as architectures change.", signal: "OCI and applications growth, software support retention, database consumption across clouds, pricing, customer wins, and competitive disclosures" },
      { title: "Cybersecurity, regulation, and Oracle Health execution", level: "Medium", text: "Security failures, privacy rules, government-contract requirements, healthcare interoperability obligations, or Oracle Health implementation issues could create liability and damage trust.", signal: "Material incidents, regulatory actions, customer remediation, litigation, uptime, and Oracle Health revenue and retention" },
    ],
    monitor: [
      { title: "RPO conversion into revenue and cash", text: "Reconcile new bookings, customer-funded hardware, recognized OCI revenue, collections, and remaining obligations rather than treating backlog growth as owner earnings.", impact: "BULL CASE" },
      { title: "OCI growth versus capital employed", text: "Compare cloud growth and margin evidence with capital expenditures, depreciation, construction in progress, and lease commencements.", impact: "NEUTRAL" },
      { title: "Financing and per-share value", text: "Track debt, cash interest, equity issuance, fully diluted shares, and free cash flow per share through the expansion cycle.", impact: "BEAR CASE" },
      { title: "Durability of database and applications", text: "Measure cloud applications growth, support retention, software revenue, multicloud database consumption, and Oracle Health execution.", impact: "NEUTRAL" },
    ],
    questions: [
      "How much of the $638 billion RPO will convert each year, and what capital, lease, and financing cost is required to recognize it?",
      "What return on invested capital does Oracle expect from each major AI data-center contract after power, accelerators, depreciation, interest, and lease expense?",
      "How much capacity is customer prepaid or customer supplied, and which risks remain with Oracle even when customers provide GPUs?",
      "Can OCI sustain rapid growth once the current wave of large AI training contracts matures into inference and normalized usage?",
      "Will the database and applications franchise continue compounding while management and capital are concentrated on infrastructure?",
      "What would cause management to slow capital spending, renegotiate contracts, or prioritize debt reduction over additional capacity?",
    ],
    competitors: "Amazon Web Services, Microsoft Azure, Google Cloud, IBM, SAP, Salesforce, Workday, Snowflake, MongoDB, open-source databases, customer-built systems, and Epic Systems in healthcare technology.",
    comparables: [
      { name: "Microsoft", ticker: "MSFT", ownership: "Public", relationship: "Direct cloud-infrastructure, database, developer-platform, and enterprise-applications competitor through Azure, SQL Server, Dynamics, and Microsoft 365", valuation: "Use live consolidated equity and enterprise value; Azure has no separately traded valuation", financialStatus: "Highly profitable and diversified. Compare cloud growth, operating margin, free cash flow, and capital intensity, recognizing that productivity, security, gaming, and other businesses affect the parent multiple.", sourceUrl: "https://www.microsoft.com/en-us/Investor/" },
      { name: "Amazon", ticker: "AMZN", ownership: "Public", relationship: "AWS is Oracle’s largest general-purpose public-cloud infrastructure benchmark and competes in databases, AI services, compute, storage, and networking", valuation: "Use live consolidated value; AWS has no separately traded valuation", financialStatus: "AWS is profitable, but Amazon’s retail, advertising, logistics, and other businesses make consolidated valuation and cash flow an imperfect OCI comparison.", sourceUrl: "https://ir.aboutamazon.com/" },
      { name: "Alphabet", ticker: "GOOGL", ownership: "Public", relationship: "Google Cloud competes in AI infrastructure, data analytics, databases, developer services, and enterprise cloud", valuation: "Use live consolidated value; Google Cloud has no separately traded valuation", financialStatus: "Profitable parent with substantial net cash and advertising earnings. Compare cloud segment growth and margin while separating the economics of Search, YouTube, and Other Bets.", sourceUrl: "https://abc.xyz/investor/" },
      { name: "SAP", ticker: "SAP", ownership: "Public", relationship: "Closest large global enterprise-applications and ERP benchmark for Oracle Fusion and related cloud applications", valuation: "Use live equity and enterprise value with currency and accounting normalization", financialStatus: "Subscription-oriented and materially less infrastructure-intensive than Oracle. Useful for comparing cloud backlog, ERP migration, applications growth, margin, and free cash flow.", sourceUrl: "https://www.sap.com/investors/en.html" },
      { name: "Salesforce", ticker: "CRM", ownership: "Public", relationship: "Direct cloud-applications competitor in customer relationship management, analytics, integration, and enterprise AI", valuation: "Use live equity and enterprise value; compare recurring revenue and free-cash-flow multiples", financialStatus: "Profitable cloud-software company with far lower infrastructure commitments. Its valuation helps isolate applications economics from Oracle’s OCI financing and database mix.", sourceUrl: "https://investor.salesforce.com/" },
      { name: "Epic Systems", ticker: "—", ownership: "Private", relationship: "Primary U.S. electronic-health-record competitor to Oracle Health", valuation: "No public standalone valuation or complete public financial statements", financialStatus: "Privately held and therefore less transparent. Compare disclosed customer adoption, implementation outcomes, interoperability, product investment, and hospital-system retention rather than market multiples.", sourceUrl: "https://www.epic.com/" },
    ],
    sources: [
      { title: "Oracle 2026 Form 10-K", meta: "SEC filing · Filed June 22, 2026", href: "https://www.sec.gov/Archives/edgar/data/1341439/000119312526277521/orcl-20260531.htm", excerpt: "The annual filing reports Oracle’s cloud and software mix, revenue, operating cash flow, capital expenditures, cash, debt, property and equipment, lease commitments, revenue recognition, competition, customers, infrastructure obligations, and risk factors." },
      { title: "Oracle Record Q4 and Fiscal 2026 Results", meta: "Company earnings release · Published June 10, 2026", href: "https://investor.oracle.com/investor-news/news-details/2026/Oracle-Announces-Record-Q4-and-FY-2026-Results-Driven-by-Cloud-Infrastructure--Cloud-Applications/", excerpt: "Oracle’s official release reports fiscal 2026 revenue, cloud and OCI growth, remaining performance obligations, operating cash flow, capital expenditures, free cash flow, financing activity, and management’s fiscal 2027 guidance." },
      { title: "Oracle Calendar 2026 Financing Plan", meta: "Company primary material · Published February 1, 2026", href: "https://investor.oracle.com/investor-news/news-details/2026/Oracle-announces-Equity-and-Debt-Financing-Plan-for-Calendar-Year-2026/default.aspx", excerpt: "Oracle described its planned mix of debt and equity financing for OCI expansion and named AMD, Meta, NVIDIA, OpenAI, TikTok, and xAI among its largest OCI customers. Customer status should not be confused with supplier status." },
      { title: "Oracle Q4 Fiscal 2026 Earnings", meta: "Company event and presentation materials · June 10, 2026", href: "https://investor.oracle.com/events-and-presentations/event-details/2026/Q4-FY26-Earnings/default.aspx", excerpt: "The official event page provides Oracle’s earnings materials and webcast for the quarter and year ended May 31, 2026." },
      { title: "Oracle SEC Filing Library", meta: "Company-indexed SEC filing access", href: "https://investor.oracle.com/sec-filings/", excerpt: "Oracle’s filing library provides direct access to annual, quarterly, current, proxy, ownership, and other SEC filings." },
    ],
  },
  RCL: {
    ticker: "RCL",
    reviewed: "August 1, 2026",
    completeness: 100,
    newsroomUrl: "https://www.rclinvestor.com/press-releases/",
    description: "A global cruise and vacation platform spanning Royal Caribbean International, Celebrity Cruises, Silversea, partner brands, ships, private destinations, loyalty, and onboard experiences.",
    lede: "Royal Caribbean Group combines differentiated ships and brands with advance bookings, passenger tickets, onboard spending, private destinations, loyalty, and a multi-year newbuild pipeline; owner value depends on sustaining pricing and guest spend while earning attractive returns on a very capital-intensive fleet.",
    sells: "Cruise vacations under Royal Caribbean International, Celebrity Cruises, and Silversea; onboard dining, beverage, casino, retail, internet, shore-excursion, spa, and other experiences; destination products; and vacation offerings through its TUI Cruises joint venture.",
    revenueModel: "Guests pay passenger-ticket revenue before sailing and buy onboard and destination experiences before and during the cruise. Profit is driven by available passenger cruise days, load factor, net yield, onboard spend, fleet and itinerary mix, and unit costs including fuel, payroll, food, commissions, and ship operating expense.",
    opportunity: "New Icon-class and other ships, differentiated brands, private destinations, digital pre-cruise merchandising, loyalty, and broader vacation products can increase capacity, price, repeat behavior, and the share of each guest’s vacation wallet.",
    mustGoRight: "New capacity must enter at attractive yields, net yield must outrun controllable unit costs, onboard and destination spending must remain strong, safety and reliability must be preserved, and ship investment plus shareholder returns must fit within a durable balance sheet.",
    editorNote: "Royal Caribbean’s July 2026 release reported $4.8 billion of quarterly revenue, a 110% load factor, 1.2% constant-currency net-yield growth, and $1.8 billion of adjusted EBITDA while raising full-year adjusted EPS guidance. Owners should now focus less on simple post-pandemic recovery and more on normalized yield, cost, return on invested capital, and whether new ships and destinations expand value faster than commitments and capital returns consume cash.",
    bullTitle: "Differentiated vacation assets with pricing power",
    bull: [
      "Royal Caribbean, Celebrity, and Silversea address distinct customer segments while shared scale supports distribution, procurement, technology, and destination investment.",
      "Large, differentiated ships and private destinations can create experiences that are difficult to replicate and support ticket price plus onboard spend.",
      "Advance bookings, deposits, loyalty, and pre-cruise purchases provide demand visibility and opportunities to deepen guest engagement.",
    ],
    bearTitle: "Strong demand must carry a very large asset base",
    bear: [
      "Ships require long lead times, large progress payments, ongoing maintenance, and high utilization; supply cannot be adjusted quickly when demand changes.",
      "Geopolitics, recession, fuel, weather, illness, incidents, port restrictions, or negative publicity can disrupt itineraries and booking behavior.",
      "Newbuilds, destination projects, debt service, dividends, and repurchases compete for cash, making capital-allocation discipline central to per-share returns.",
    ],
    thesisBreaker: "If record pricing and high load factors fail to translate into durable free cash flow and high-teen returns on invested capital after newbuild, destination, maintenance, and financing needs, the differentiated-vacation-platform thesis requires reassessment.",
    financialDrivers: [
      { label: "NET YIELD", value: "Guest economics", detail: "Ticket pricing, load factor, onboard and destination spend, itinerary and brand mix, and cancellations" },
      { label: "UNIT COST", value: "Operating leverage", detail: "Net cruise cost excluding fuel per APCD, fuel, crew, drydock, food, commissions, and productivity" },
      { label: "INVESTED CAPITAL", value: "Fleet returns", detail: "New-ship and destination capex, delivery schedule, financing, free cash flow, leverage, and ROIC" },
    ],
    risks: [
      { title: "Demand and itinerary disruption", level: "High", text: "Consumer confidence, air access, geopolitical events, weather, health events, and port availability can alter bookings, pricing, cancellations, and deployment.", signal: "Booked load factors and prices, close-in demand, cancellations, itinerary changes, and customer deposits" },
      { title: "Fleet and capital commitments", level: "High", text: "Ships and destinations require multi-year commitments; delays, shipyard constraints, cost inflation, or weaker utilization can reduce lifetime returns while debt and progress payments remain due.", signal: "Orderbook, committed financing, capex, net debt, interest expense, free cash flow, and ROIC" },
      { title: "Safety, environmental, and operating events", level: "High", text: "A ship or destination incident, cyber failure, illness, regulatory breach, or environmental event can interrupt operations and damage brand trust across the portfolio.", signal: "Material incidents, voyage disruptions, regulatory actions, insurance costs, and guest-satisfaction trends" },
    ],
    monitor: [
      { title: "Price, load, and onboard spend", text: "Separate capacity growth from like-for-like pricing and measure whether onboard and destination engagement expands total yield.", impact: "BULL CASE" },
      { title: "Cost per APCD", text: "Compare constant-currency net cruise cost excluding fuel with net-yield growth, adjusting for drydock and timing effects.", impact: "NEUTRAL" },
      { title: "Newbuild and destination returns", text: "Track each major ship and destination from committed capital through utilization, yield premium, cash generation, and return on invested capital.", impact: "BEAR CASE" },
    ],
    questions: [
      "How much current net-yield growth comes from like-for-like price and spend rather than new capacity and mix?",
      "What cash-on-cash returns do the newest ships and private destinations earn after all associated capital and financing costs?",
      "Can net cruise cost excluding fuel remain below yield growth through the next delivery and drydock cycle?",
      "How should owners balance newbuild investment, debt reduction, dividends, and repurchases at the current point in the cycle?",
    ],
    competitors: "Carnival Corporation, Norwegian Cruise Line Holdings, MSC Cruises, premium and luxury cruise operators, resorts, hotels, tour operators, theme parks, and other global vacation alternatives.",
    sources: [
      { title: "Royal Caribbean 2025 Form 10-K", meta: "SEC filing · Filed February 11, 2026", href: "https://www.sec.gov/Archives/edgar/data/884887/000088488726000007/rcl-20251231.htm", excerpt: "The annual filing describes Royal Caribbean, Celebrity, Silversea, TUI Cruises, the combined fleet, passenger-ticket and onboard revenue, capacity and yield metrics, ship commitments, debt, competition, regulation, and operating risks." },
      { title: "Royal Caribbean Second-Quarter 2026 Results", meta: "Company earnings release · Published July 28, 2026", href: "https://www.rclinvestor.com/press-releases/release/?id=1845", excerpt: "The official release reports second-quarter revenue, guests, load factor, net yields, unit costs, adjusted EBITDA, updated guidance, booking conditions, fuel hedging, and capital returns." },
      { title: "Royal Caribbean First-Quarter 2026 Form 10-Q", meta: "SEC filing · Filed April 30, 2026", href: "https://www.sec.gov/Archives/edgar/data/884887/000088488726000026/rcl-20260331.htm", excerpt: "The filing details passenger-ticket and onboard revenue, cruise operating costs, liquidity, fleet obligations, joint-venture income, customer deposits, derivatives, debt, and risk disclosures." },
      { title: "Royal Caribbean Investor Relations", meta: "Company primary materials", href: "https://www.rclinvestor.com/", excerpt: "Official earnings releases, SEC filings, webcasts, presentations, governance materials, dividend history, and shareholder information published by Royal Caribbean Group." },
    ],
  },
};

for (const [ticker, upgrade] of Object.entries(flagshipDossierUpgrades)) {
  const existing = featuredDossiers[ticker];
  if (existing) featuredDossiers[ticker] = { ...existing, ...upgrade };
}

featuredDossiers.SPCX = spcxDossier;
featuredDossiers.TSLA = tslaDossier;

Object.assign(featuredDossiers, additionalFlagshipDossiers);
Object.assign(featuredDossiers, sp500Batch01Dossiers);
Object.assign(featuredDossiers, sp500Batch02Dossiers);
Object.assign(featuredDossiers, legacyCompleteDossiers);
Object.assign(featuredDossiers, sp500Batch03Dossiers);
Object.assign(featuredDossiers, sp500Batch04Dossiers);
Object.assign(featuredDossiers, sp500Batch05Dossiers);
Object.assign(featuredDossiers, sp500Batch06Dossiers);
featuredDossiers.FCEL = fcelDossier;

// Alphabet's two S&P 500 share classes represent one underlying company and
// therefore share the same evidence-linked owner dossier.
if (featuredDossiers.GOOG) featuredDossiers.GOOGL = { ...featuredDossiers.GOOG, ticker: "GOOGL" };

for (const [ticker, complement] of Object.entries(dossierBenchmarkComplements)) {
  const existing = featuredDossiers[ticker];
  if (existing) featuredDossiers[ticker] = completeDossierBenchmark(existing, complement);
}

for (const [ticker, dossier] of Object.entries(featuredDossiers)) {
  featuredDossiers[ticker] = applyEvidenceStandard(dossier);
}
