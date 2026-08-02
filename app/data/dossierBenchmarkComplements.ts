import type { FeaturedDossier } from "./featuredDossiers";

type Complement = Partial<Pick<FeaturedDossier, "financialDrivers" | "risks" | "monitor" | "questions" | "comparables" | "sources">>;

export const dossierBenchmarkComplements: Record<string, Complement> = {
  NVDA: {
    financialDrivers: [
      { label: "OPERATING CASH FLOW", value: "Cash conversion", detail: "Compare customer collections, inventory, supplier prepayments, taxes, and capital expenditures with reported earnings" },
      { label: "DILUTED SHARE COUNT", value: "Per-share test", detail: "Measure repurchases against stock compensation, employee issuance, and acquisition consideration" },
    ],
    risks: [
      { title: "Product-transition execution", level: "High", text: "Rapid architecture changes can create qualification delays, inventory exposure, supply imbalance, and customer pauses.", signal: "Launch timing, inventory, purchase commitments, transition costs, and customer deployment schedules" },
      { title: "Platform concentration and regulation", level: "Medium", text: "CUDA, networking, acquisitions, and market leadership attract competition and regulatory scrutiny across jurisdictions.", signal: "Competition investigations, licensing remedies, developer adoption, and software attach" },
    ],
    monitor: [{ title: "Per-share cash conversion", text: "Reconcile GAAP earnings, stock compensation, operating cash flow, capex, repurchases, and fully diluted shares.", impact: "NEUTRAL" }],
    questions: ["What working-capital and supply commitments are required for each architecture transition?", "Can software and services become material recurring revenue independent of accelerator cycles?"],
    comparables: [
      { name: "Marvell Technology", ticker: "MRVL", ownership: "Public", relationship: "Networking and custom-compute comparable", valuation: "Compare data-center growth, margin, and customer concentration", financialStatus: "Smaller semiconductor supplier with meaningful cloud infrastructure exposure.", sourceUrl: "https://investor.marvell.com/" },
      { name: "Cerebras Systems", ticker: "PRIVATE", ownership: "Private", relationship: "Specialized AI systems and accelerator competitor", valuation: "No continuously observable public valuation", financialStatus: "Private disclosures provide less complete financial and customer-concentration evidence.", sourceUrl: "https://www.cerebras.ai/" },
    ],
    sources: [{ title: "NVIDIA Annual Reports and Proxies", meta: "Company governance and annual filing archive", href: "https://investor.nvidia.com/financial-info/annual-reports-and-proxies/default.aspx", excerpt: "Annual reports and proxy materials provide business, governance, executive compensation, share-count, capital-allocation, and risk evidence." }],
  },
  AAPL: {
    financialDrivers: [
      { label: "INSTALLED BASE", value: "Retention and upgrades", detail: "Active devices, replacement cycles, regional mix, and the attach of paid services" },
      { label: "SUPPLY & INVENTORY", value: "Execution", detail: "Component availability, manufacturing concentration, channel inventory, freight, tariffs, and product transitions" },
    ],
    risks: [
      { title: "Distribution and default economics", level: "High", text: "App-store rules, payments, browser defaults, and search arrangements face regulatory remedies and partner renegotiation.", signal: "Services gross margin, commission changes, default contracts, fines, and mandated product changes" },
      { title: "Manufacturing and supplier concentration", level: "High", text: "Critical components and assembly remain concentrated among a limited number of suppliers and geographies.", signal: "Supplier diversification, inventory, lead times, tariffs, product availability, and warranty costs" },
    ],
    monitor: [{ title: "Capital returns versus innovation", text: "Compare repurchases and dividends with R&D, acquisitions, manufacturing commitments, and fully diluted share reduction.", impact: "NEUTRAL" }],
    questions: ["What portion of services profit depends on distribution arrangements vulnerable to remedies?", "Which manufacturing dependencies remain hardest to diversify without sacrificing cost or product cadence?"],
    comparables: [
      { name: "Sony Group", ticker: "SONY", ownership: "Public", relationship: "Consumer hardware, media, gaming, sensors, and ecosystem comparable", valuation: "Separate entertainment, imaging, finance, and hardware segments", financialStatus: "Profitable diversified electronics and entertainment group with different recurring economics.", sourceUrl: "https://www.sony.com/en/SonyInfo/IR/" },
      { name: "Xiaomi", ticker: "1810.HK", ownership: "Public", relationship: "Smartphone, device, services, and connected-home competitor", valuation: "Normalize geography, hardware margin, and internet-services mix", financialStatus: "Profitable device ecosystem with lower price points and different regional exposure.", sourceUrl: "https://ir.mi.com/" },
    ],
    sources: [{ title: "Apple Annual Reports", meta: "Company annual filing archive", href: "https://investor.apple.com/sec-filings/default.aspx", excerpt: "Apple's annual, quarterly, current, proxy, and ownership filings provide product, geography, supply, cash-flow, share-count, governance, and risk evidence." }],
  },
  AMZN: {
    financialDrivers: [
      { label: "FREE CASH FLOW", value: "Owner cash test", detail: "Operating cash flow less equipment, data-center, fulfillment, and finance-lease investment" },
      { label: "CAPITAL EMPLOYED", value: "Return discipline", detail: "AWS infrastructure, logistics, leases, content, acquisitions, and working capital" },
    ],
    risks: [
      { title: "Operating complexity and labor", level: "High", text: "Fulfillment, delivery, workplace, wage, contractor, and safety execution can create cost and regulatory pressure.", signal: "Cost to serve, injury metrics, wages, delivery speed, labor actions, and regulatory findings" },
      { title: "Content, devices, and experimental allocation", level: "Medium", text: "Media, healthcare, devices, satellites, and other initiatives can consume capital without strengthening core returns.", signal: "Segment disclosures, impairments, restructuring, cash commitments, and adoption milestones" },
    ],
    monitor: [{ title: "Free cash flow after leases", text: "Reconcile operating cash flow with equipment purchases, finance leases, stock compensation, and working-capital timing.", impact: "NEUTRAL" }],
    questions: ["What normalized free cash flow remains after all AWS and logistics lease commitments?", "Which non-core initiatives have explicit return hurdles and exit criteria?"],
    comparables: [
      { name: "Oracle", ticker: "ORCL", ownership: "Public", relationship: "Cloud infrastructure and database competitor", valuation: "Adjust for debt, leases, and data-center commitments", financialStatus: "Profitable software franchise undertaking a capital-intensive cloud buildout.", sourceUrl: "https://investor.oracle.com/" },
      { name: "MercadoLibre", ticker: "MELI", ownership: "Public", relationship: "Marketplace, logistics, advertising, and payments comparable", valuation: "Compare geography, fintech credit, margin, and growth", financialStatus: "Profitable Latin American commerce and fintech platform with different macro exposure.", sourceUrl: "https://investor.mercadolibre.com/" },
    ],
    sources: [{ title: "Amazon Annual Reports and Proxies", meta: "Company annual filing archive", href: "https://ir.aboutamazon.com/annual-reports-proxies-and-shareholder-letters/default.aspx", excerpt: "Annual reports, proxies, and shareholder letters provide long-term evidence on segments, capital allocation, governance, commitments, and risk." }],
  },
  CAT: {
    financialDrivers: [
      { label: "SERVICES REVENUE", value: "Installed-base value", detail: "Parts, maintenance, digital, remanufacturing, dealer capability, and fleet utilization" },
      { label: "DEALER INVENTORY", value: "Demand quality", detail: "End-user sales versus dealer stocking, order backlog, cancellations, and production scheduling" },
    ],
    risks: [
      { title: "Cycle and commodity exposure", level: "High", text: "Construction, mining, energy, transportation, and customer financing respond to rates, commodity prices, and investment cycles.", signal: "Retail sales, backlog, dealer inventory, commodity prices, utilization, and credit losses" },
      { title: "Financial Products and credit", level: "Medium", text: "Dealer and customer financing supports sales but adds funding, residual-value, delinquency, and concentration risk.", signal: "Past dues, credit losses, financing receivables, funding cost, and used-equipment values" },
    ],
    monitor: [{ title: "Orders versus dealer inventory", text: "Separate end-user demand and services activity from dealer stocking or destocking across regions and industries.", impact: "NEUTRAL" }],
    questions: ["How much through-cycle value comes from services versus original equipment?", "What financing and residual-value losses are implied by a severe mining or construction downturn?"],
    comparables: [
      { name: "Volvo Group", ticker: "VOLV-B.ST", ownership: "Public", relationship: "Heavy equipment, engines, trucks, services, and finance competitor", valuation: "Normalize currency, truck cycle, and finance operations", financialStatus: "Profitable global industrial platform with meaningful commercial-vehicle exposure.", sourceUrl: "https://www.volvogroup.com/en/investors.html" },
      { name: "CNH Industrial", ticker: "CNH", ownership: "Public", relationship: "Construction and agricultural equipment comparable", valuation: "Agriculture mix and finance operations require separation", financialStatus: "Cyclical equipment manufacturer with a different end-market mix and scale.", sourceUrl: "https://www.cnh.com/investors" },
    ],
    sources: [{ title: "Caterpillar Annual Reports", meta: "Company annual filing archive", href: "https://investors.caterpillar.com/financials/annual-reports/default.aspx", excerpt: "Annual reports describe segments, dealers, services, backlog, inventory, Financial Products, cash flow, capital returns, and risk." }],
  },
  BA: {
    financialDrivers: [
      { label: "COMMERCIAL DELIVERIES", value: "Cash conversion", detail: "737, 787, and widebody production, certification, rework, pricing, advances, and customer acceptance" },
      { label: "FREE CASH FLOW", value: "Recovery test", detail: "Customer advances, inventory, supplier payments, production stabilization, defense charges, and capex" },
    ],
    risks: [
      { title: "Quality, certification, and production", level: "High", text: "Manufacturing defects, supplier nonconformance, regulatory findings, or accidents can stop deliveries and increase rework and compensation.", signal: "FAA actions, traveled work, inventory, deliveries, rework, customer claims, and incident findings" },
      { title: "Fixed-price defense programs", level: "High", text: "Development and production contracts can generate additional reach-forward losses when schedules, design, or labor assumptions change.", signal: "Program charges, estimate-at-completion revisions, milestones, and contract modifications" },
    ],
    monitor: [{ title: "Delivery-to-cash conversion", text: "Compare production and deliveries with inventory, advances, supplier payments, concessions, and free cash flow.", impact: "NEUTRAL" }],
    questions: ["What objective quality metrics determine whether production can safely increase?", "Which fixed-price programs still contain the largest unrecognized downside scenarios?"],
    comparables: [
      { name: "Embraer", ticker: "ERJ", ownership: "Public", relationship: "Commercial aircraft and services competitor", valuation: "Compare backlog, delivery growth, margin, and net debt", financialStatus: "Smaller profitable aircraft manufacturer focused on regional and executive markets.", sourceUrl: "https://ri.embraer.com.br/en/" },
      { name: "General Dynamics", ticker: "GD", ownership: "Public", relationship: "Defense and business-jet manufacturing comparable", valuation: "Separate Gulfstream and defense segments", financialStatus: "Profitable diversified contractor with a different fixed-price and commercial mix.", sourceUrl: "https://investorrelations.gd.com/" },
    ],
    sources: [{ title: "Boeing Annual Reports", meta: "Company annual filing archive", href: "https://investors.boeing.com/investors/reports/default.aspx", excerpt: "Annual reports and statistical summaries provide program, backlog, delivery, liquidity, debt, pension, cash-flow, and risk evidence." }],
  },
  BB: {
    financialDrivers: [
      { label: "ANNUAL RECURRING REVENUE", value: "Retention quality", detail: "QNX development, secure communications, renewals, dollar retention, and contract duration" },
      { label: "FREE CASH FLOW", value: "Self-funding test", detail: "Collections, restructuring, working capital, R&D, investment income, and capital returns" },
    ],
    risks: [
      { title: "Backlog timing and non-binding assumptions", level: "High", text: "Automotive design wins and royalty backlog depend on vehicle launches, production volumes, program duration, pricing, and customer decisions.", signal: "Vehicle starts, production units, backlog revisions, average royalty, and recognized QNX revenue" },
      { title: "Customer concentration and platform substitution", level: "High", text: "OEM consolidation, insourcing, Android, AUTOSAR, open source, and competing embedded platforms can limit content per vehicle.", signal: "Named wins, customer mix, displaced programs, software layers, and pricing" },
    ],
    monitor: [{ title: "Cash-backed capital allocation", text: "Compare recurring revenue and operating cash flow with R&D, restructuring, buybacks, acquisitions, and investment balances.", impact: "NEUTRAL" }],
    questions: ["How much disclosed QNX backlog is subject to production-volume assumptions or cancellation?", "Which recurring-revenue and cash metrics should replace legacy consolidated measures for owner accountability?"],
    comparables: [
      { name: "Cerence", ticker: "CRNC", ownership: "Public", relationship: "Automotive software and embedded voice comparable", valuation: "Adjust for leverage, customer concentration, and turnaround risk", financialStatus: "Smaller automotive software vendor with different product and balance-sheet exposure.", sourceUrl: "https://investors.cerence.com/" },
      { name: "CrowdStrike", ticker: "CRWD", ownership: "Public", relationship: "Endpoint and enterprise-security comparable", valuation: "Cloud security growth multiples are not directly applicable to Secure Communications", financialStatus: "High-growth cloud security platform with a different customer and delivery model.", sourceUrl: "https://ir.crowdstrike.com/" },
    ],
    sources: [{ title: "BlackBerry Annual Reports", meta: "Company annual filing archive", href: "https://investors.blackberry.com/financial-information/annual-reports", excerpt: "Annual reports provide segment, backlog, revenue-recognition, customer, cash-flow, governance, capital-allocation, and risk evidence." }],
  },
  BE: {
    financialDrivers: [
      { label: "PRODUCT ACCEPTANCE", value: "Revenue timing", detail: "System delivery, installation, customer acceptance, construction, interconnection, and project milestones" },
      { label: "OPERATING CASH FLOW", value: "Funding test", detail: "Receivables, inventory, customer deposits, supplier commitments, tax credits, and capex" },
    ],
    risks: [
      { title: "Customer and project concentration", level: "High", text: "Large orders and acceptance milestones can concentrate revenue, receivables, execution, and cancellation exposure.", signal: "Top-customer share, backlog, receivables, deposits, project delays, and contract modifications" },
      { title: "Policy, fuel, and grid economics", level: "Medium", text: "Tax incentives, tariffs, natural-gas economics, interconnection rules, emissions regulation, and utility pricing affect project returns.", signal: "Tax-credit rules, tariffs, fuel spreads, permitting, utility tariffs, and customer payback" },
    ],
    monitor: [{ title: "Bookings-to-cash conversion", text: "Reconcile backlog and shipments with acceptance, receivables, deposits, gross profit, inventory, and operating cash flow.", impact: "NEUTRAL" }],
    questions: ["What portion of backlog has firm pricing, customer funding, and scheduled interconnection?", "How sensitive are customer returns to gas prices, tariffs, tax credits, and data-center utilization?"],
    comparables: [
      { name: "Siemens Energy", ticker: "ENR.DE", ownership: "Public", relationship: "Power generation, grid, service, and energy-infrastructure comparable", valuation: "Separate grid, gas services, and wind economics", financialStatus: "Scaled global energy-equipment company with materially broader operations.", sourceUrl: "https://www.siemens-energy.com/global/en/home/investor-relations.html" },
      { name: "Generac", ticker: "GNRC", ownership: "Public", relationship: "Distributed generation, storage, and energy-management competitor", valuation: "Compare residential, commercial, and data-center mix", financialStatus: "Profitable distributed-power platform with different fuel-cell and project exposure.", sourceUrl: "https://investors.generac.com/" },
    ],
    sources: [{ title: "Bloom Energy Annual Reports", meta: "Company annual filing archive", href: "https://investor.bloomenergy.com/financial-information/annual-reports-and-proxy/default.aspx", excerpt: "Annual reports and proxies provide customer, project, manufacturing, warranty, policy, liquidity, share-count, governance, and risk evidence." }],
  },
  RKLB: {
    financialDrivers: [
      { label: "R&D AND CASH BURN", value: "Funding runway", detail: "Neutron, spacecraft, launch infrastructure, acquisitions, stock compensation, capex, and working capital" },
      { label: "CONTRACT MIX", value: "Margin quality", detail: "Firm versus option value, fixed-price exposure, government funding, milestone accounting, and mission timing" },
    ],
    risks: [
      { title: "Neutron schedule and technical execution", level: "High", text: "A new reusable launch system requires engine, structure, stage, pad, software, regulatory, recovery, and production milestones.", signal: "Hot-fire tests, stage tests, pad readiness, licenses, contracted missions, remaining capex, and target-date changes" },
      { title: "Mission and contract concentration", level: "High", text: "Launch failures, customer delays, government protests, fixed-price overruns, or spacecraft defects can materially affect results.", signal: "Mission success, backlog concentration, program charges, insurance, and schedule revisions" },
    ],
    monitor: [{ title: "Liquidity per milestone", text: "Track cash and financing against Neutron milestones, acquisitions, capex, operating losses, and diluted shares.", impact: "BEAR CASE" }],
    questions: ["Which Neutron milestones retire the most technical and financing risk?", "What portion of backlog is funded, non-cancelable, and protected against cost escalation?"],
    comparables: [
      { name: "Redwire", ticker: "RDW", ownership: "Public", relationship: "Space infrastructure, components, spacecraft, and government-program comparable", valuation: "Compare backlog, acquisition mix, margin, leverage, and cash burn", financialStatus: "Smaller public space platform with meaningful acquisition and program exposure.", sourceUrl: "https://ir.redwirespace.com/" },
      { name: "Firefly Aerospace", ticker: "PRIVATE", ownership: "Private", relationship: "Launch, lunar, and spacecraft competitor", valuation: "No continuously observable public valuation", financialStatus: "Private financial statements and complete program economics are unavailable.", sourceUrl: "https://fireflyspace.com/" },
    ],
    sources: [{ title: "Rocket Lab Annual Reports", meta: "Company annual filing archive", href: "https://investors.rocketlabcorp.com/financial-information/annual-reports", excerpt: "Annual reports provide segment, backlog, mission, development, acquisition, liquidity, share-count, governance, and risk evidence." }],
  },
  PLTR: {
    financialDrivers: [
      { label: "REMAINING DEAL VALUE", value: "Contract visibility", detail: "Firm commitments, termination rights, option periods, contract duration, timing, and customer concentration" },
      { label: "DILUTED SHARES", value: "Per-share conversion", detail: "Stock compensation, payroll taxes, repurchases, option exercises, and acquisition issuance" },
    ],
    risks: [
      { title: "Valuation and expectation risk", level: "High", text: "A high implied growth and margin path can produce material downside even when reported operations remain strong.", signal: "Revenue expectations, bookings, margin, cash flow, share count, and implied long-term growth" },
      { title: "Deployment and customer concentration", level: "Medium", text: "Complex deployments, large contracts, government procurement, and a limited number of material customers can create timing and renewal volatility.", signal: "Top-customer share, deal duration, deployment labor, renewals, protests, and remaining obligations" },
    ],
    monitor: [{ title: "GAAP per-share economics", text: "Reconcile adjusted results with GAAP operating income, stock compensation, payroll taxes, operating cash flow, and diluted shares.", impact: "BEAR CASE" }],
    questions: ["What contract and deployment characteristics predict durable expansion after the first AI pilot?", "What fully diluted share path should owners use when translating company growth into per-share value?"],
    comparables: [
      { name: "Microsoft", ticker: "MSFT", ownership: "Public", relationship: "Enterprise data, cloud, AI, security, and developer-platform competitor", valuation: "Compare growth and margin within a much broader platform", financialStatus: "Highly profitable diversified platform with enormous installed-base distribution.", sourceUrl: "https://www.microsoft.com/en-us/Investor/" },
      { name: "ServiceNow", ticker: "NOW", ownership: "Public", relationship: "Enterprise workflow, data, automation, and AI comparable", valuation: "Compare subscription growth, remaining obligations, margin, and free cash flow", financialStatus: "Profitable cloud workflow platform with a different deployment and government mix.", sourceUrl: "https://www.servicenow.com/company/investor-relations.html" },
    ],
    sources: [{ title: "Palantir Annual Reports", meta: "Company annual filing archive", href: "https://investors.palantir.com/financials/annual-reports", excerpt: "Annual reports provide contract, customer, platform, stock-compensation, governance, liquidity, cash-flow, and risk evidence." }],
  },
  AMC: {
    financialDrivers: [
      { label: "ADMISSIONS PER PATRON", value: "Price and mix", detail: "Premium formats, recliners, location mix, loyalty, dynamic pricing, and attendance elasticity" },
      { label: "INTEREST & LIQUIDITY", value: "Balance-sheet test", detail: "Cash interest, maturities, exchanges, repayments, restricted cash, and operating cash flow" },
      { label: "DILUTED SHARE COUNT", value: "Per-share recovery", detail: "At-the-market issuance, exchanges, warrants, compensation, and debt converted into equity" },
    ],
    risks: [
      { title: "Film supply and release concentration", level: "High", text: "Attendance depends on studio release volume, title quality, windows, labor relations, and a limited number of major films.", signal: "Domestic box office, release calendar, studio concentration, attendance, and film-rental expense" },
      { title: "Dilution and refinancing", level: "High", text: "Debt exchanges, equity issuance, high interest cost, and maturity management may preserve liquidity while reducing per-share participation.", signal: "Fully diluted shares, debt principal, cash interest, maturity schedule, exchange terms, and free cash flow" },
    ],
    monitor: [{ title: "Premium-format unit economics", text: "Measure IMAX, Dolby, premium large format, recliner, food and beverage, and loyalty investment against attendance, spend, and cash returns.", impact: "BULL CASE" }],
    questions: ["What attendance and spend level covers normalized rent, interest, maintenance, and growth capex?", "How much of debt reduction has improved per-share value after associated dilution and exchange consideration?"],
  },
  RCL: {
    financialDrivers: [
      { label: "CUSTOMER DEPOSITS", value: "Forward demand", detail: "Booked load, pricing, cancellation terms, timing, and cash required to deliver future voyages" },
      { label: "FREE CASH FLOW", value: "Capital test", detail: "Operating cash flow less newbuild, destination, maintenance, drydock, and technology investment" },
      { label: "NET DEBT & INTEREST", value: "Balance-sheet resilience", detail: "Debt maturities, ship financing, rates, liquidity, dividends, and repurchases" },
    ],
    risks: [
      { title: "Fuel, currency, and input volatility", level: "Medium", text: "Fuel, food, labor, commissions, air access, currencies, and port costs can move faster than ticket and onboard pricing.", signal: "Fuel cost, hedges, net cruise cost, currency sensitivity, wages, and commissions" },
      { title: "Consumer credit and deposit obligations", level: "Medium", text: "Advance deposits provide funding but create refund and service obligations if itineraries or demand are disrupted.", signal: "Customer deposits, cancellations, refunds, credit-card reserves, and close-in pricing" },
    ],
    monitor: [{ title: "Cash return after committed growth", text: "Reconcile adjusted EBITDA with interest, taxes, maintenance, newbuild and destination capex, working capital, and share count.", impact: "NEUTRAL" }],
    questions: ["What normalized free cash flow remains after all committed ship and destination investment?", "How sensitive are returns to fuel, rates, currency, and a moderate reduction in load factor?"],
    comparables: [
      { name: "Carnival Corporation", ticker: "CCL", ownership: "Public", relationship: "Largest global public cruise competitor", valuation: "Compare enterprise value, berth capacity, brands, leverage, and normalized cash flow", financialStatus: "Scaled profitable cruise operator with higher leverage and different brand mix.", sourceUrl: "https://www.carnivalcorp.com/" },
      { name: "Norwegian Cruise Line Holdings", ticker: "NCLH", ownership: "Public", relationship: "Contemporary, premium, and luxury cruise competitor", valuation: "Compare yield, cost, fleet commitments, leverage, and free cash flow", financialStatus: "Smaller public cruise operator with meaningful debt and committed newbuilds.", sourceUrl: "https://www.nclhltd.com/investors" },
      { name: "TUI AG", ticker: "TUI1.DE", ownership: "Public", relationship: "Vacation platform and cruise-joint-venture comparable", valuation: "Separate tour operations, airlines, hotels, and cruises", financialStatus: "Profitable diversified European travel group with a different asset and distribution mix.", sourceUrl: "https://www.tuigroup.com/en-en/investors" },
      { name: "Viking Holdings", ticker: "VIK", ownership: "Public", relationship: "Premium river, ocean, and expedition cruise comparable", valuation: "Compare customer mix, advance deposits, fleet commitments, margin, and leverage", financialStatus: "Public premium cruise operator with a narrower destination-led model.", sourceUrl: "https://ir.viking.com/" },
      { name: "MSC Cruises", ticker: "PRIVATE", ownership: "Private", relationship: "Large global cruise competitor", valuation: "No continuously observable public valuation", financialStatus: "Private financial statements and complete fleet economics are unavailable.", sourceUrl: "https://www.msccruises.com/" },
      { name: "Hilton Worldwide", ticker: "HLT", ownership: "Public", relationship: "Asset-light global vacation and lodging comparable", valuation: "Hotel fee economics are not directly comparable to ship ownership", financialStatus: "Profitable asset-light lodging platform useful for comparing consumer travel demand and loyalty.", sourceUrl: "https://ir.hilton.com/" },
    ],
    sources: [{ title: "Royal Caribbean Annual Reports", meta: "Company annual filing archive", href: "https://www.rclinvestor.com/financial-information/annual-reports/", excerpt: "Annual reports provide brand, fleet, yield, cost, deposits, commitments, debt, cash-flow, governance, and risk evidence." }],
  },
};

export function completeDossierBenchmark(dossier: FeaturedDossier, complement: Complement): FeaturedDossier {
  return {
    ...dossier,
    completeness: 100,
    financialDrivers: [...dossier.financialDrivers, ...(complement.financialDrivers ?? [])],
    risks: [...dossier.risks, ...(complement.risks ?? [])],
    monitor: [...dossier.monitor, ...(complement.monitor ?? [])],
    questions: [...dossier.questions, ...(complement.questions ?? [])],
    comparables: [...(dossier.comparables ?? []), ...(complement.comparables ?? [])],
    sources: [...dossier.sources, ...(complement.sources ?? [])],
  };
}
