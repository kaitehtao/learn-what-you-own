import type { Metadata } from "next";
import { CompanyUniverseDirectory } from "../../CompanyUniverseDirectory";
import { ResearchUniverseStructuredData } from "../../ResearchUniverseStructuredData";

const description = "Search Nasdaq-100 company dossiers by ticker, company, market capitalization, and research depth.";

export const metadata: Metadata = {
  title: "Search Nasdaq-100 Company Dossiers | Learn What You Own",
  description,
  alternates: { canonical: "https://learnwhatyouown.com/research/nasdaq-100" },
};

export default function Nasdaq100ResearchUniversePage() {
  return <><ResearchUniverseStructuredData name="Nasdaq-100 Company Research" path="/research/nasdaq-100" description={description} /><CompanyUniverseDirectory market="listed" indexMembership="Nasdaq-100 (QQQ)" /></>;
}
