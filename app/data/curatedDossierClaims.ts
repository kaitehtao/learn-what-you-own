export type CuratedDossierClaim = {
  section: "business_model" | "segments" | "revenue_drivers" | "risk_factors" | "owner_watchlist";
  claimType: "verified_fact" | "company_statement" | "editorial_analysis";
  claim: string;
  whyItMatters: string;
  sourceExcerpt: string;
};

export type CuratedDossierBundle = {
  sourceTitle: string;
  sourceUrl: string;
  filingType: "10-K";
  filedAt: string;
  claims: CuratedDossierClaim[];
};

export const firstAlphabeticalABatch = ["A", "AA", "AAL", "AAMI", "AAOI", "AAON", "AAP", "AAPL", "AAT", "ABAT"] as const;

export const curatedDossierBundles: Record<(typeof firstAlphabeticalABatch)[number], CuratedDossierBundle> = {
  A: {
    sourceTitle: "Agilent Technologies 2025 Form 10-K",
    sourceUrl: "https://www.sec.gov/Archives/edgar/data/1090872/000109087225000087/a-20251031.htm",
    filingType: "10-K",
    filedAt: "2025-12-22",
    claims: [
      { section: "business_model", claimType: "verified_fact", claim: "Agilent supplies instruments, software, services, consumables and application-focused solutions across laboratory workflows in life sciences, diagnostics and applied markets.", whyItMatters: "The company combines instrument placements with service and consumables demand across regulated and research-oriented laboratories.", sourceExcerpt: "Item 1 describes Agilent as a laboratory-workflow supplier spanning instruments, software, services and consumables." },
      { section: "segments", claimType: "verified_fact", claim: "After its fiscal 2025 reorganization, Agilent reports Life Sciences and Diagnostics Markets, Agilent CrossLab and Applied Markets as three reportable segments.", whyItMatters: "The reorganized segments separate instrument platforms, recurring laboratory support and applied-market systems.", sourceExcerpt: "Item 1 identifies the three reportable segments and explains the divisions assigned to each." },
      { section: "revenue_drivers", claimType: "verified_fact", claim: "Agilent CrossLab serves installed laboratory workflows with services, consumables, software and automation offerings.", whyItMatters: "CrossLab ties part of Agilent's economics to laboratories already using analytical systems rather than only to new instrument purchases.", sourceExcerpt: "Item 1 describes CrossLab as an extensive services and consumables portfolio supplemented by software and laboratory automation." },
      { section: "risk_factors", claimType: "verified_fact", claim: "Agilent's results depend on customer laboratory spending, pharmaceutical and biotechnology activity, government and academic funding, and the timing of instrument demand.", whyItMatters: "A laboratory-tool supplier can face delayed orders when customers constrain capital budgets even if long-term end-market demand remains intact.", sourceExcerpt: "Items 1 and 1A describe exposure to research, clinical, pharmaceutical, government and applied-market spending conditions." },
      { section: "owner_watchlist", claimType: "editorial_analysis", claim: "The central owner question is whether CrossLab and consumables growth can offset volatility in large instrument purchases.", whyItMatters: "A larger recurring mix would make growth and margins less dependent on customer capital-equipment cycles.", sourceExcerpt: "This interpretation is grounded in the filing's separation of instrument platforms from CrossLab services and consumables." },
    ],
  },
  AA: {
    sourceTitle: "Alcoa 2025 Form 10-K",
    sourceUrl: "https://www.sec.gov/Archives/edgar/data/1675149/000119312526077167/aa-20251231.htm",
    filingType: "10-K",
    filedAt: "2026-02-26",
    claims: [
      { section: "business_model", claimType: "verified_fact", claim: "Alcoa participates across the upstream aluminum chain through bauxite mining, alumina refining, aluminum smelting and casting.", whyItMatters: "Vertical exposure connects earnings to several conversion steps, operating assets and commodity markets rather than to a single finished product.", sourceExcerpt: "Item 1 describes an integrated chain from bauxite mines and alumina refineries to smelting and casting." },
      { section: "segments", claimType: "verified_fact", claim: "Alcoa reports two business segments: Alumina and Aluminum.", whyItMatters: "The Alumina segment captures mining and refining, while Aluminum contains smelting, casting and most energy-production assets.", sourceExcerpt: "Item 1 identifies Alumina and Aluminum as the company's two reportable segments." },
      { section: "revenue_drivers", claimType: "verified_fact", claim: "Alcoa's realized economics are directly exposed to aluminum prices on the London Metal Exchange and alumina benchmark pricing.", whyItMatters: "Commodity-price changes can overwhelm volume or productivity improvements and create substantial earnings volatility.", sourceExcerpt: "Item 1 explains that aluminum is priced through the LME and alumina is subject to market-index pricing." },
      { section: "risk_factors", claimType: "verified_fact", claim: "Energy availability and cost are material to Alcoa because refining and smelting are power-intensive and the Aluminum segment includes energy-production assets.", whyItMatters: "Power contracts, curtailments and regional energy conditions can determine whether capacity is economic to operate.", sourceExcerpt: "Items 1 and 1A connect smelting operations and energy assets with significant commodity and operating-cost exposure." },
      { section: "owner_watchlist", claimType: "editorial_analysis", claim: "Owners should separate improvements under management control from movements caused by aluminum, alumina and energy benchmarks.", whyItMatters: "That distinction is necessary to judge durable operating progress through a commodity cycle.", sourceExcerpt: "The filing distinguishes operating segments and explains their direct exposure to market-based commodity prices." },
    ],
  },
  AAL: {
    sourceTitle: "American Airlines Group 2025 Form 10-K",
    sourceUrl: "https://www.sec.gov/Archives/edgar/data/6201/000000620126000014/aal-20251231.htm",
    filingType: "10-K",
    filedAt: "2026-02-18",
    claims: [
      { section: "business_model", claimType: "verified_fact", claim: "American Airlines provides scheduled passenger and cargo air transportation through a network of mainline and regional operations.", whyItMatters: "Network breadth, schedule utility and connections through hubs determine the revenue opportunity and asset utilization.", sourceExcerpt: "Item 1 describes American's mainline network and the American Eagle regional operation that supplies connecting traffic." },
      { section: "segments", claimType: "verified_fact", claim: "American Eagle carriers include wholly owned and third-party regional airlines that serve smaller markets and feed connecting traffic into American's hubs.", whyItMatters: "Regional lift expands network reach but also creates operational dependence on outside carriers and contractual capacity.", sourceExcerpt: "Item 1 identifies the regional carriers and explains their role serving markets that are not economical for larger aircraft." },
      { section: "revenue_drivers", claimType: "verified_fact", claim: "Passenger demand, fares, capacity, loyalty-program economics and network execution are core drivers of American's revenue.", whyItMatters: "Small changes in unit revenue or load factor can have a large earnings effect against a high fixed-cost base.", sourceExcerpt: "Items 1 and 7 discuss passenger revenue, network operations and the loyalty program as central economic components." },
      { section: "risk_factors", claimType: "verified_fact", claim: "American is materially exposed to aircraft-fuel prices and availability, labor costs, operational disruptions, regulation and substantial financing obligations.", whyItMatters: "These costs and obligations can pressure liquidity during weak demand or irregular operations.", sourceExcerpt: "Item 1A identifies fuel volatility, labor, regulation, disruptions and liquidity among the principal risks." },
      { section: "owner_watchlist", claimType: "editorial_analysis", claim: "The owner debate turns on whether revenue and loyalty economics can produce sustained free cash flow after fleet, labor, fuel and debt requirements.", whyItMatters: "Reported demand strength is less valuable if fixed claims on cash prevent durable balance-sheet improvement.", sourceExcerpt: "This interpretation combines the filing's network revenue discussion with its fuel, labor, capital and liquidity risks." },
    ],
  },
  AAMI: {
    sourceTitle: "Acadian Asset Management 2025 Form 10-K",
    sourceUrl: "https://www.sec.gov/Archives/edgar/data/1748824/000162828026012856/aami-20251231.htm",
    filingType: "10-K",
    filedAt: "2026-02-27",
    claims: [
      { section: "business_model", claimType: "verified_fact", claim: "Acadian Asset Management's sole operating business is institutional asset management through its majority-owned Acadian subsidiary.", whyItMatters: "The company has concentrated exposure to the economics, investment performance and client retention of one asset-management platform.", sourceExcerpt: "Item 1 identifies Acadian LLC as the operating business and Quant & Solutions as the reportable segment." },
      { section: "segments", claimType: "verified_fact", claim: "Acadian offers systematic investment strategies across global markets and reported approximately $178 billion of assets under management at December 31, 2025.", whyItMatters: "Scale supports fee revenue, while systematic breadth and global coverage define the client proposition.", sourceExcerpt: "Item 1 reports approximately $178 billion of AUM and describes a diversified array of systematic strategies." },
      { section: "revenue_drivers", claimType: "verified_fact", claim: "Management fees depend on assets under management, which change with investment performance, client flows, market levels and product mix.", whyItMatters: "Revenue can rise or fall without a matching change in the firm's operating resources, creating operating leverage in both directions.", sourceExcerpt: "Items 1 and 1A connect AUM retention, performance, market conditions, fee levels and earnings." },
      { section: "risk_factors", claimType: "verified_fact", claim: "Acadian derives a substantial portion of revenue from a limited number of strategies and depends on retaining clients, consultants and key investment personnel.", whyItMatters: "Weak performance or a personnel departure can affect both flows and the perceived durability of the investment process.", sourceExcerpt: "Item 1A highlights strategy concentration, client relationships, competitive performance and key-person risk." },
      { section: "owner_watchlist", claimType: "editorial_analysis", claim: "The most important owner indicators are net flows, strategy performance and fee mix rather than market-driven AUM alone.", whyItMatters: "Those measures better distinguish franchise health from passive changes in asset values.", sourceExcerpt: "The filing identifies performance, flows, market levels and fee pressure as separate drivers of AUM and revenue." },
    ],
  },
  AAOI: {
    sourceTitle: "Applied Optoelectronics 2025 Form 10-K",
    sourceUrl: "https://www.sec.gov/Archives/edgar/data/1158114/000143774926005875/aaoi20251231_10k.htm",
    filingType: "10-K",
    filedAt: "2026-02-26",
    claims: [
      { section: "business_model", claimType: "verified_fact", claim: "Applied Optoelectronics is a vertically integrated optical-networking supplier serving internet data centers, cable television, telecommunications and fiber-to-the-home markets.", whyItMatters: "The company participates from laser components through modules and complete equipment, which creates both technical control and manufacturing complexity.", sourceExcerpt: "Item 1 describes four end markets and products ranging from laser components to turn-key optical equipment." },
      { section: "segments", claimType: "verified_fact", claim: "AAOI focuses on higher-performance optical products whose demand is tied to bandwidth growth from cloud computing, video and connected devices.", whyItMatters: "Product cycles and customer qualification timing can determine whether industry bandwidth growth converts into company revenue.", sourceExcerpt: "Item 1 links the target markets to bandwidth demand and emphasizes higher-performance connectivity products." },
      { section: "revenue_drivers", claimType: "verified_fact", claim: "AAOI's quarterly gross margin depends on product mix and customer pricing, while revenue is concentrated primarily in data-center and cable-TV customers.", whyItMatters: "A strong shipment quarter can still produce weak economics if mix or negotiated pricing deteriorates.", sourceExcerpt: "Item 1 states that gross margin depends heavily on mix and price and discusses concentration in data-center and CATV markets." },
      { section: "risk_factors", claimType: "verified_fact", claim: "Two customers each represented more than 10% of AAOI's 2025 revenue, and the company expects continued concentration among its largest data-center customers.", whyItMatters: "Customer program timing, purchasing changes or qualification losses can materially alter revenue.", sourceExcerpt: "Item 1's customer-concentration discussion reports two greater-than-10% customers in 2025." },
      { section: "owner_watchlist", claimType: "editorial_analysis", claim: "Owners should track new-product qualification, customer concentration and gross-margin conversion together.", whyItMatters: "Bandwidth demand alone does not establish durable value if a small number of customers control volumes and pricing.", sourceExcerpt: "This interpretation combines the filing's bandwidth-demand, product-development, mix and customer-concentration disclosures." },
    ],
  },
  AAON: {
    sourceTitle: "AAON 2025 Form 10-K",
    sourceUrl: "https://www.sec.gov/Archives/edgar/data/824142/000082414226000005/aaon-20251231.htm",
    filingType: "10-K",
    filedAt: "2026-03-02",
    claims: [
      { section: "business_model", claimType: "verified_fact", claim: "AAON engineers and manufactures highly configurable and custom heating, ventilation and air-conditioning systems, controls, coils and aftermarket parts.", whyItMatters: "Engineering content and configuration differentiate AAON from standardized equipment suppliers but require manufacturing execution.", sourceExcerpt: "Item 1 describes configurable HVAC systems, controls, aftermarket parts and custom coils." },
      { section: "segments", claimType: "verified_fact", claim: "AAON operates through AAON Oklahoma, AAON Coil Products and BASX, with BASX focused on custom high-performance cooling for hyperscale data centers.", whyItMatters: "BASX gives the company a direct growth vector tied to data-center thermal-management investment.", sourceExcerpt: "Item 1 identifies the operating businesses and describes BASX's data-center cooling focus." },
      { section: "revenue_drivers", claimType: "verified_fact", claim: "AAON's results depend on order demand, production capacity, lead times, pricing and the cost and availability of components and raw materials.", whyItMatters: "Backlog creates opportunity only if facilities and suppliers convert orders into timely, profitable shipments.", sourceExcerpt: "Items 1 and 1A discuss manufacturing facilities, production expansion, supply inputs and order execution." },
      { section: "risk_factors", claimType: "verified_fact", claim: "AAON is exposed to construction and capital-spending cycles, manufacturing disruptions, labor availability and the execution risks of expanding capacity.", whyItMatters: "Rapid expansion can pressure margins or service levels if demand, staffing and factory readiness do not align.", sourceExcerpt: "Item 1A describes demand cyclicality, manufacturing, workforce, supply-chain and expansion risks." },
      { section: "owner_watchlist", claimType: "editorial_analysis", claim: "The key owner test is whether data-center cooling growth can scale without eroding AAON's delivery performance and margin discipline.", whyItMatters: "Capacity growth is valuable only when the company preserves product quality, lead times and returns on new manufacturing investment.", sourceExcerpt: "This interpretation is grounded in BASX growth disclosures and the filing's manufacturing-capacity risks." },
    ],
  },
  AAP: {
    sourceTitle: "Advance Auto Parts 2025 Form 10-K",
    sourceUrl: "https://www.sec.gov/Archives/edgar/data/1158449/000119312526051305/aap-20260103.htm",
    filingType: "10-K",
    filedAt: "2026-02-13",
    claims: [
      { section: "business_model", claimType: "verified_fact", claim: "Advance Auto Parts sells automotive replacement parts, accessories, batteries and maintenance items to professional installers, do-it-yourself customers and independent operators.", whyItMatters: "The model combines local parts availability, professional delivery and consumer retail demand across an aging vehicle fleet.", sourceExcerpt: "Item 1 describes the professional, DIY and independent-store customer groups and the principal product categories." },
      { section: "segments", claimType: "verified_fact", claim: "At January 3, 2026, Advance operated 4,305 stores and served 809 independently owned Carquest-branded stores across North America and nearby markets.", whyItMatters: "Store and distribution density determine availability, delivery speed and the fixed-cost base.", sourceExcerpt: "Item 1 reports 4,305 company stores and 809 independent Carquest locations at fiscal year-end." },
      { section: "revenue_drivers", claimType: "verified_fact", claim: "Advance is concentrating on its blended-box Advance model after selling Worldpac and is executing a plan centered on merchandising, supply-chain transformation and store operations.", whyItMatters: "The investment case depends on operational improvement inside the retained network rather than growth through portfolio breadth.", sourceExcerpt: "Item 1 describes the Worldpac sale, the strategic shift and the multi-year operational plan." },
      { section: "risk_factors", claimType: "verified_fact", claim: "Advance opened 39 stores and closed 522 during fiscal 2025 as it completed the footprint-optimization portion of its restructuring plan.", whyItMatters: "A large network reset introduces execution, customer-retention, inventory and cost-savings risk.", sourceExcerpt: "Item 1 reports the 2025 store openings and closures and links them to footprint optimization." },
      { section: "owner_watchlist", claimType: "editorial_analysis", claim: "Owners should judge the turnaround through comparable sales, availability, inventory productivity and operating margin—not store closures alone.", whyItMatters: "A smaller footprint creates value only if the retained network serves customers better and produces sustainable cash returns.", sourceExcerpt: "This interpretation follows the filing's merchandising, supply-chain, store-operations and restructuring disclosures." },
    ],
  },
  AAPL: {
    sourceTitle: "Apple 2025 Form 10-K",
    sourceUrl: "https://www.sec.gov/Archives/edgar/data/320193/000032019325000079/aapl-20250927.htm",
    filingType: "10-K",
    filedAt: "2025-10-31",
    claims: [
      { section: "business_model", claimType: "verified_fact", claim: "Apple designs, manufactures and markets smartphones, computers, tablets, wearables and accessories and sells related services.", whyItMatters: "Apple combines device economics with software, content, payments, cloud and support services across an installed base.", sourceExcerpt: "Item 1 lists Apple's principal hardware categories and related services." },
      { section: "segments", claimType: "verified_fact", claim: "Apple manages its business primarily by geography through the Americas, Europe, Greater China, Japan and Rest of Asia Pacific segments.", whyItMatters: "Regional demand, currencies, regulation and channel conditions affect results even though the product portfolio is broadly shared.", sourceExcerpt: "Item 1 identifies the five geographic reportable segments and their management rationale." },
      { section: "revenue_drivers", claimType: "verified_fact", claim: "Apple reaches consumers, businesses, education, enterprise and government customers through direct retail, online and sales channels plus indirect carriers and resellers.", whyItMatters: "Distribution breadth supports scale, while channel inventory and partner economics can influence reported product demand.", sourceExcerpt: "Item 1 describes customer markets and the company's direct and indirect distribution channels." },
      { section: "risk_factors", claimType: "verified_fact", claim: "A majority of Apple's supplier facilities, including manufacturing and assembly sites, are outside the United States, and sales outside the United States are a majority of net sales.", whyItMatters: "Supply concentration, trade policy, currencies and regional economic conditions can affect both product availability and demand.", sourceExcerpt: "Item 1A describes the global supply chain and majority-international sales exposure." },
      { section: "owner_watchlist", claimType: "editorial_analysis", claim: "The owner debate centers on whether ecosystem engagement and services can deepen monetization while hardware innovation sustains replacement demand.", whyItMatters: "Both installed-base economics and continued product relevance are necessary to support durable growth.", sourceExcerpt: "This interpretation is grounded in the filing's integrated products, services, distribution and competition disclosures." },
    ],
  },
  AAT: {
    sourceTitle: "American Assets Trust 2025 Form 10-K",
    sourceUrl: "https://www.sec.gov/Archives/edgar/data/1500217/000150021726000008/aat-20251231.htm",
    filingType: "10-K",
    filedAt: "2026-02-06",
    claims: [
      { section: "business_model", claimType: "verified_fact", claim: "American Assets Trust is a vertically integrated REIT that owns, operates, acquires and develops office, retail, multifamily and mixed-use properties.", whyItMatters: "Rental income and property value depend on occupancy, lease economics, operating costs and local supply-demand conditions.", sourceExcerpt: "Item 1 describes the company as a self-administered REIT across four property categories." },
      { section: "segments", claimType: "verified_fact", claim: "At December 31, 2025, AAT's portfolio included 12 office properties, 11 retail centers, one hotel-and-retail mixed-use property and seven multifamily properties.", whyItMatters: "The portfolio mixes lease durations, tenant demand drivers and operating sensitivity across property types.", sourceExcerpt: "Item 1 provides the year-end property count by office, retail, mixed-use and multifamily category." },
      { section: "revenue_drivers", claimType: "verified_fact", claim: "AAT concentrates its portfolio in high-barrier markets including Southern and Northern California, Washington, Oregon, Texas and Hawaii.", whyItMatters: "Scarce sites can support rents, but geographic concentration exposes the portfolio to regional employment, regulation and property-market conditions.", sourceExcerpt: "Item 1 identifies the core markets and describes many assets as infill properties with constrained new supply." },
      { section: "risk_factors", claimType: "verified_fact", claim: "AAT is exposed to tenant defaults, leasing and occupancy risk, property-value changes, interest rates, refinancing needs and REIT distribution requirements.", whyItMatters: "Property cash flow and capital costs jointly determine dividend capacity and net asset value.", sourceExcerpt: "Item 1A discusses tenant, real-estate, financing, interest-rate and REIT qualification risks." },
      { section: "owner_watchlist", claimType: "editorial_analysis", claim: "Owners should compare same-property cash flow and leasing spreads with financing costs and upcoming debt maturities.", whyItMatters: "Improving property operations may not create equity value if refinancing costs absorb the benefit.", sourceExcerpt: "This interpretation combines the filing's leasing economics with its debt and interest-rate risk disclosures." },
    ],
  },
  ABAT: {
    sourceTitle: "American Battery Technology 2025 Form 10-K",
    sourceUrl: "https://www.sec.gov/Archives/edgar/data/1576873/000149315225014092/form10-k.htm",
    filingType: "10-K",
    filedAt: "2025-09-18",
    claims: [
      { section: "business_model", claimType: "verified_fact", claim: "American Battery Technology is developing commercial systems for lithium-ion battery recycling and for producing primary battery metals from domestic resources.", whyItMatters: "The strategy addresses both recycled feedstock and upstream domestic mineral supply, but each requires separate technical and capital execution.", sourceExcerpt: "Item 1 describes battery recycling and primary battery-metals extraction as the company's two core technology areas." },
      { section: "segments", claimType: "verified_fact", claim: "ABTC's recycling process combines automated battery de-manufacturing with a targeted chemical extraction train for high-value metals.", whyItMatters: "Economic performance depends on recovery rates, throughput, feedstock quality and the cost of scaling the process.", sourceExcerpt: "Item 1 describes the two-phase recycling system and the output streams from de-manufacturing and chemical extraction." },
      { section: "revenue_drivers", claimType: "verified_fact", claim: "ABTC has commenced commercial recycling operations and is ramping production capacity while advancing the Tonopah Flats lithium project.", whyItMatters: "Near-term value depends on proving reliable commercial throughput; the resource project represents a longer-duration development option.", sourceExcerpt: "Items 1 and 1A discuss the commercial ramp and the separate Tonopah Flats development program." },
      { section: "risk_factors", claimType: "verified_fact", claim: "ABTC reported substantial doubt about its ability to continue as a going concern and stated that significant additional financing may be required to fund operations and facilities.", whyItMatters: "Financing availability, terms and dilution can determine whether the technical plan reaches sustained commercial scale.", sourceExcerpt: "Item 1A's summary risk factors identifies going-concern uncertainty and a need for significant additional financing." },
      { section: "owner_watchlist", claimType: "editorial_analysis", claim: "The decisive milestones are sustained plant throughput, recovery economics, dependable feedstock and funded development—not laboratory capability alone.", whyItMatters: "Commercial evidence must close the gap between a differentiated process and a self-funding operating model.", sourceExcerpt: "This interpretation is grounded in the filing's scale-up, feedstock, metal-price, financing and going-concern disclosures." },
    ],
  },
};

export function getCuratedDossierBundle(ticker: string) {
  return curatedDossierBundles[ticker as keyof typeof curatedDossierBundles] ?? null;
}
