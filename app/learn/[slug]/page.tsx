import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "../../ui";
import { guideBySlug, learningGuides } from "../guides";

const origin = "https://learnwhatyouown.com";
const reviewedDate = "2026-08-03";

export function generateStaticParams() {
  return learningGuides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = guideBySlug.get(slug);
  if (!guide) return {};
  const url = `${origin}/learn/${guide.slug}`;
  return {
    title: `${guide.title} | Learn What You Own`,
    description: guide.description,
    alternates: { canonical: url },
    openGraph: { title: guide.title, description: guide.description, url, type: "article", images: [{ url: "/og.png", width: 1200, height: 630, alt: "Learn What You Own" }] },
    twitter: { card: "summary_large_image", title: guide.title, description: guide.description, images: ["/og.png"] },
  };
}

export default async function LearningGuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = guideBySlug.get(slug);
  if (!guide) notFound();
  const url = `${origin}/learn/${guide.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: guide.title,
        description: guide.description,
        datePublished: reviewedDate,
        dateModified: reviewedDate,
        mainEntityOfPage: url,
        author: { "@type": "Organization", name: "Learn What You Own Research", url: `${origin}/founders-letter` },
        publisher: { "@type": "Organization", name: "Learn What You Own", url: origin, logo: { "@type": "ImageObject", url: `${origin}/og.png` } },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: origin },
          { "@type": "ListItem", position: 2, name: "Learn", item: `${origin}/learn` },
          { "@type": "ListItem", position: 3, name: guide.title, item: url },
        ],
      },
    ],
  };

  return <main>
    <Header />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replaceAll("<", "\\u003c") }} />
    <article className="learning-guide">
      <header className="learning-guide-hero">
        <div className="container">
          <nav aria-label="Breadcrumb"><Link href="/">Home</Link><span>›</span><Link href="/learn">Learn</Link></nav>
          <span className="kicker">{guide.searchIntent}</span>
          <h1>{guide.title}</h1>
          <p>{guide.description}</p>
          <div><strong>Learn What You Own Research</strong><span>Reviewed August 3, 2026 · {guide.readingTime}</span></div>
        </div>
      </header>
      <div className="container learning-guide-layout">
        <aside className="learning-guide-nav">
          <strong>In this guide</strong>
          {guide.sections.map((section) => <a href={`#${section.id}`} key={section.id}>{section.title}</a>)}
          <a href="#checklist">Owner checklist</a>
          <a href="#questions">Common questions</a>
        </aside>
        <div className="learning-guide-body">
          <p className="learning-guide-outcome"><strong>What this guide gives you</strong>{guide.outcome}</p>
          {guide.sections.map((section) => <section id={section.id} key={section.id}>
            <h2>{section.title}</h2>
            {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            {section.bullets && <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}
          </section>)}
          <section id="checklist" className="learning-checklist">
            <span className="kicker">PUT IT INTO PRACTICE</span><h2>Your owner checklist</h2>
            <ol>{guide.checklist.map((item) => <li key={item}><span>✓</span>{item}</li>)}</ol>
          </section>
          <section id="questions" className="learning-questions">
            <span className="kicker">COMMON QUESTIONS</span><h2>What investors ask next</h2>
            {guide.questions.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}
          </section>
          <section className="learning-related">
            <span className="kicker">CONTINUE YOUR RESEARCH</span><h2>Use the framework</h2>
            <div>{guide.related.map((item) => <Link href={item.href} key={item.href}>{item.label}<span>→</span></Link>)}</div>
          </section>
          <p className="learning-source-note">Primary-source starting points include company SEC filings, filed exhibits, proxy statements, and issuer investor-relations materials. Always verify the reporting period, filing date, definitions, and source rights. For research and education only; not individualized investment advice.</p>
        </div>
      </div>
    </article>
  </main>;
}
