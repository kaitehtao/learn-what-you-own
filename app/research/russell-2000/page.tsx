import type { Metadata } from "next";
import { CompanyUniverseDirectory } from "../../CompanyUniverseDirectory";

export const metadata: Metadata = {
  title: "Search Russell 2000 Company Dossiers | Learn What You Own",
  description: "Search Russell 2000 company dossiers by ticker, company, market capitalization, and research depth.",
};

export default function Russell2000ResearchUniversePage() {
  return <CompanyUniverseDirectory market="listed" indexMembership="Russell 2000" />;
}
