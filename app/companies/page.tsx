import type { Metadata } from "next";
import { CompanyUniverseDirectory } from "../CompanyUniverseDirectory";

export const metadata: Metadata = {
  title: "Search Public Company Stock Dossiers | Learn What You Own",
  description: "Search public-company research by ticker, company, index membership, market capitalization, and dossier depth.",
  alternates: { canonical: "https://learnwhatyouown.com/companies" },
};

export default function CompaniesPage() {
  return <CompanyUniverseDirectory market="listed" />;
}
