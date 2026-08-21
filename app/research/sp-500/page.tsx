import type { Metadata } from "next";
import { CompanyUniverseDirectory } from "../../CompanyUniverseDirectory";
import { ResearchUniverseStructuredData } from "../../ResearchUniverseStructuredData";

const description = "Search S&P 500 company dossiers by ticker, company, market capitalization, and research depth.";

export const metadata: Metadata = {
  title: "Search S&P 500 Company Dossiers | Learn What You Own",
  description,
  alternates: { canonical: "https://learnwhatyouown.com/research/sp-500" },
};

export default function SP500ResearchUniversePage() {
  return <><ResearchUniverseStructuredData name="S&P 500 Company Research" path="/research/sp-500" description={description} /><CompanyUniverseDirectory market="listed" indexMembership="S&P 500" /></>;
}
