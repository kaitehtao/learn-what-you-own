import type { Metadata } from "next";
import { CompanyUniverseDirectory } from "../../CompanyUniverseDirectory";
import { ResearchUniverseStructuredData } from "../../ResearchUniverseStructuredData";

const description = "Search Russell 2000 company dossiers by ticker, company, market capitalization, and research depth.";

export const metadata: Metadata = {
  title: "Search Russell 2000 Company Dossiers | Learn What You Own",
  description,
  alternates: { canonical: "https://learnwhatyouown.com/research/russell-2000" },
};

export default function Russell2000ResearchUniversePage() {
  return <><ResearchUniverseStructuredData name="Russell 2000 Company Research" path="/research/russell-2000" description={description} /><CompanyUniverseDirectory market="listed" indexMembership="Russell 2000" /></>;
}
