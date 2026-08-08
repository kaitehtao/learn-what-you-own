import type { Metadata } from "next";
import { CompanyUniverseDirectory } from "../../CompanyUniverseDirectory";

export const metadata: Metadata = {
  title: "Search Nasdaq-100 Company Dossiers | Learn What You Own",
  description: "Search Nasdaq-100 company dossiers by ticker, company, market capitalization, and research depth.",
  alternates: { canonical: "https://learnwhatyouown.com/research/nasdaq-100" },
};

export default function Nasdaq100ResearchUniversePage() {
  return <CompanyUniverseDirectory market="listed" indexMembership="Nasdaq-100 (QQQ)" />;
}
