import { makeStructuredDossier, type StructuredDossierProfile } from "./structuredDossierFactory";

const profiles: StructuredDossierProfile[] = [
  { ticker: "A", name: "Agilent Technologies", sector: "Health Care", focus: "analytical instruments, laboratory software, consumables, services, and diagnostics used in life-science, pharmaceutical, chemical, and clinical workflows", officialUrl: "https://www.investor.agilent.com/", newsroomUrl: "https://www.agilent.com/about/newsroom/" },
  { ticker: "AA", name: "Alcoa", sector: "Materials", focus: "bauxite mining, alumina refining, aluminum smelting and casting, and low-carbon metal products across a global asset portfolio", officialUrl: "https://investors.alcoa.com/", newsroomUrl: "https://news.alcoa.com/" },
  { ticker: "AAL", name: "American Airlines Group", sector: "Industrials", focus: "scheduled passenger air travel, loyalty economics, cargo, and a large global network operated through American Airlines", officialUrl: "https://americanairlines.gcs-web.com/", newsroomUrl: "https://news.aa.com/" },
  { ticker: "AAMI", name: "Acadian Asset Management", sector: "Financials", focus: "systematic investment strategies and research-driven asset management for institutional and intermediary clients", officialUrl: "https://ir.acadian-inc.com/", newsroomUrl: "https://www.acadian-asset.com/about-us/news" },
  { ticker: "AAOI", name: "Applied Optoelectronics", sector: "Information Technology", focus: "optical transceivers, lasers, and networking components for data-center, cable broadband, telecommunications, and fiber-access markets", officialUrl: "https://investors.ao-inc.com/", newsroomUrl: "https://investors.ao-inc.com/news-events/news-releases" },
  { ticker: "AAON", name: "AAON", sector: "Industrials", focus: "engineered commercial HVAC equipment, controls, replacement parts, and high-efficiency cooling systems including data-center applications", officialUrl: "https://investors.aaon.com/", newsroomUrl: "https://investors.aaon.com/news-events/news-releases" },
  { ticker: "AAP", name: "Advance Auto Parts", sector: "Consumer Discretionary", focus: "automotive replacement parts, accessories, batteries, maintenance products, and professional repair-shop distribution", officialUrl: "https://ir.advanceautoparts.com/", newsroomUrl: "https://ir.advanceautoparts.com/news-and-events/news-releases" },
  { ticker: "AAT", name: "American Assets Trust", sector: "Real Estate", focus: "office, retail, multifamily, and mixed-use real estate concentrated in high-barrier West Coast and Hawaii markets", officialUrl: "https://investors.americanassetstrust.com/", newsroomUrl: "https://investors.americanassetstrust.com/news-events/news-releases" },
  { ticker: "ABAT", name: "American Battery Technology Company", sector: "Materials", focus: "lithium-ion battery recycling, primary lithium extraction technology, and domestic critical-mineral processing capacity", officialUrl: "https://americanbatterytechnology.com/investors/", newsroomUrl: "https://americanbatterytechnology.com/news/" },
  { ticker: "ONDS", name: "Ondas Holdings", sector: "Industrials", focus: "autonomous drone platforms, counter-UAS systems, industrial wireless networks, and mission software for defense, public safety, rail, and critical infrastructure", officialUrl: "https://ir.ondas.com/", newsroomUrl: "https://ir.ondas.com/news-events/press-releases" },
];

export const legacyCompleteDossiers = Object.fromEntries(
  profiles.map((profile) => [profile.ticker, makeStructuredDossier(profile)]),
);

export const legacyCompletedTickers = profiles.map((profile) => profile.ticker);
