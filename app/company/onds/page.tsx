import type { Metadata } from "next";
import { FeaturedCompanyDossier } from "../../FeaturedCompanyDossier";
import { featuredDossiers } from "../../data/featuredDossiers";
import { researchUniverse } from "../../data/universe";
import { findPublishedDossier } from "../../../db/publishedDossier";

export const dynamic = "force-dynamic";

const canonical = "https://learnwhatyouown.com/company/onds";

export async function generateMetadata(): Promise<Metadata> {
  const dossier = await findPublishedDossier("ONDS");
  const description = dossier?.description || featuredDossiers.ONDS.description;
  return {
    title: "Ondas Holdings (ONDS) Stock Research, SEC Filings & Valuation | Learn What You Own",
    description,
    alternates: { canonical },
    robots: dossier ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { title: "Ondas Holdings (ONDS) Ownership Dossier", description, url: canonical, type: "article" },
  };
}

export default function OndasCompanyPage() {
  const company = researchUniverse.find((candidate) => candidate.ticker === "ONDS");
  const dossier = featuredDossiers.ONDS;
  if (!company || !dossier) throw new Error("ONDS must be registered in the complete dossier universe.");
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${canonical}#dossier`,
        url: canonical,
        headline: "Ondas Holdings (ONDS) ownership dossier",
        description: dossier.description,
        author: { "@type": "Organization", name: "Learn What You Own", url: "https://learnwhatyouown.com/" },
        publisher: { "@type": "Organization", name: "Learn What You Own", url: "https://learnwhatyouown.com/" },
        about: { "@type": "Corporation", name: "Ondas Holdings", tickerSymbol: "ONDS" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://learnwhatyouown.com/" },
          { "@type": "ListItem", position: 2, name: "Companies", item: "https://learnwhatyouown.com/companies" },
          { "@type": "ListItem", position: 3, name: "Ondas Holdings (ONDS)", item: canonical },
        ],
      },
    ],
  };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replaceAll("<", "\\u003c") }} />
    <FeaturedCompanyDossier company={company} dossier={dossier} />
  </>;
}
