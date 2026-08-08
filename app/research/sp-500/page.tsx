import type { Metadata } from "next";
import { CompanyUniverseDirectory } from "../../CompanyUniverseDirectory";

export const metadata: Metadata = {
  title: "Search S&P 500 Company Dossiers | Learn What You Own",
  description: "Search S&P 500 company dossiers by ticker, company, market capitalization, and research depth.",
  alternates: { canonical: "https://learnwhatyouown.com/research/sp-500" },
};

export default function SP500ResearchUniversePage() {
  return <CompanyUniverseDirectory market="listed" indexMembership="S&P 500" />;
}
