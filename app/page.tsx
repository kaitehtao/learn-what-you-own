import type { Metadata } from "next";
import HomePageClient from "./HomePageClient";

const canonicalUrl = "https://learnwhatyouown.com/";

export const metadata: Metadata = {
  title: "Learn What You Own | Evidence-Linked Stock Research",
  description: "Research the business behind each ticker with evidence-linked company dossiers, SEC filings, ownership, valuation, earnings, risks, and bull and bear cases.",
  alternates: { canonical: canonicalUrl },
  openGraph: {
    title: "Learn What You Own | Evidence-Linked Stock Research",
    description: "Understand the business behind every ticker through source-linked ownership dossiers.",
    url: canonicalUrl,
    type: "website",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${canonicalUrl}#organization`,
      name: "Learn What You Own",
      url: canonicalUrl,
      logo: `${canonicalUrl}favicon.svg`,
      description: "Evidence-linked investment research for investors who want to understand the business behind a ticker.",
    },
    {
      "@type": "WebSite",
      "@id": `${canonicalUrl}#website`,
      url: canonicalUrl,
      name: "Learn What You Own",
      publisher: { "@id": `${canonicalUrl}#organization` },
      inLanguage: "en-US",
    },
  ],
};

export default function HomePage() {
  return <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replaceAll("<", "\\u003c") }}
    />
    <HomePageClient />
  </>;
}
