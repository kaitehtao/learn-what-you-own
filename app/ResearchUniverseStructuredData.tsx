const origin = "https://learnwhatyouown.com";

export function ResearchUniverseStructuredData({ name, path, description }: {
  name: string;
  path: string;
  description: string;
}) {
  const canonical = `${origin}${path}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${canonical}#collection`,
        url: canonical,
        name,
        headline: name,
        description,
        inLanguage: "en-US",
        isPartOf: { "@type": "WebSite", name: "Learn What You Own", url: `${origin}/` },
        publisher: { "@type": "Organization", name: "Learn What You Own", url: `${origin}/` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
          { "@type": "ListItem", position: 2, name: "Research", item: `${origin}/research/batches` },
          { "@type": "ListItem", position: 3, name, item: canonical },
        ],
      },
    ],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replaceAll("<", "\\u003c") }} />;
}
