export type FeaturedDossier = {
  ticker: string;
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
  sources: { title: string; meta: string; href: string; excerpt: string }[];
};

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
    description: "Purpose-built cloud infrastructure for accelerated and artificial-intelligence workloads.",
    lede: "CoreWeave operates a specialized cloud designed around GPU-intensive workloads, offering infrastructure and software that help customers deploy AI at scale.",
    sells: "GPU compute, storage, networking, managed software, orchestration, and related cloud services.",
    revenueModel: "Usage and contracted infrastructure capacity, including commitments tied to dedicated AI clusters.",
    opportunity: "AI developers need scarce, optimized infrastructure delivered faster and with more specialized support than general-purpose clouds may provide.",
    mustGoRight: "CoreWeave must finance capacity efficiently, diversify customers, execute data-center delivery, and keep utilization high.",
    editorNote: "The opportunity is large, but the owner’s lens must focus on contract quality, customer concentration, debt, supplier dependence, and returns on each capacity build.",
    bullTitle: "A specialized AI cloud built for urgency",
    bull: ["Purpose-built infrastructure can improve deployment speed and workload performance.", "Customer commitments can provide visibility for new capacity.", "Software and operational specialization may distinguish the platform from commodity compute."],
    bearTitle: "Rapid growth financed ahead of certainty",
    bear: ["Infrastructure expansion requires substantial debt and capital.", "Revenue and contract exposure can be concentrated.", "The business depends on access to advanced GPUs, power, and data-center execution."],
    thesisBreaker: "Falling utilization or contract repricing alongside high fixed obligations would challenge the economics of rapid capacity expansion.",
    financialDrivers: [{ label: "BACKLOG", value: "Contract quality", detail: "Duration, counterparties, pricing, and cancellation terms" }, { label: "CAPACITY", value: "Utilization", detail: "GPU availability, power, delivery, and occupancy" }, { label: "FINANCING", value: "Cost of growth", detail: "Debt, lease obligations, and cash conversion" }],
    risks: [{ title: "Customer concentration", level: "High", text: "A limited group of AI and technology customers can represent significant demand.", signal: "Top-customer share and contract changes" }, { title: "Leverage and commitments", level: "High", text: "Capacity is financed before its full lifetime economics are known.", signal: "Interest burden and committed capex" }, { title: "Supplier dependence", level: "High", text: "Advanced accelerators and related infrastructure come from a concentrated supply chain.", signal: "GPU allocation and delivery timing" }],
    monitor: [{ title: "Backlog conversion", text: "Compare contracted demand with delivered capacity, revenue, and cash collection.", impact: "BULL CASE" }, { title: "Financing intensity", text: "Track whether incremental growth improves or consumes free cash flow.", impact: "BEAR CASE" }],
    questions: ["What are normalized returns on a fully utilized cluster?", "How protected are contracts if compute prices fall?", "How quickly can customer concentration decline?"],
    competitors: "AWS, Microsoft Azure, Google Cloud, Oracle Cloud, Lambda, and other specialized GPU clouds.",
    sources: [{ title: "CoreWeave SEC filing library", meta: "SEC EDGAR · Primary source", href: "https://www.sec.gov/edgar/browse/?CIK=1769628&owner=exclude", excerpt: "CoreWeave’s filings describe its specialized cloud platform, customer contracts, concentration, infrastructure commitments, financing, suppliers, and operating risks." }, { title: "CoreWeave Investor Relations", meta: "Company investor materials", href: "https://investors.coreweave.com/", excerpt: "Official results, SEC filings, news, events, and governance information published by CoreWeave." }],
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
};
