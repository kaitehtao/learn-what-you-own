import type { Metadata } from "next";
import { CompanyUniverseDirectory } from "../../CompanyUniverseDirectory";
import { ResearchUniverseStructuredData } from "../../ResearchUniverseStructuredData";

const description = "Search Russell 3000 company dossiers by ticker, company, market capitalization, and research depth.";

export const metadata: Metadata = {
  title: "Search Russell 3000 Company Dossiers | Learn What You Own",
  description,
  alternates: { canonical: "https://learnwhatyouown.com/research/russell-3000" },
};

export default function Russell3000ResearchUniversePage() {
  return <><ResearchUniverseStructuredData name="Russell 3000 Company Research" path="/research/russell-3000" description={description} /><CompanyUniverseDirectory market="listed" indexMembership="Russell 3000" /></>;
}
