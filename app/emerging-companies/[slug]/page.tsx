import { eq } from "drizzle-orm";
import Link from "next/link";
import { getDb } from "../../../db";
import { emergingCompanyDossiers } from "../../../db/schema";
import { Header } from "../../ui";

export const dynamic = "force-dynamic";

export default async function EmergingCompanyPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug.toLowerCase();
  let dossier: typeof emergingCompanyDossiers.$inferSelect | undefined;
  try {
    [dossier] = await getDb().select().from(emergingCompanyDossiers).where(eq(emergingCompanyDossiers.slug, slug)).limit(1);
  } catch (error) {
    console.error("Emerging-company dossier unavailable", error);
  }
  if (!dossier) return <main><Header/><section className="simple-page container"><span className="kicker">DOSSIER NOT FOUND</span><h1>This company has not been approved.</h1><p>Private and pre-IPO profiles remain unpublished until editorial review is complete.</p><Link className="button dark-button" href="/emerging-companies">Return to the directory</Link></section></main>;
  return <main><Header/>
    <section className="emerging-dossier-hero"><div className="container"><Link href="/emerging-companies">← IPO &amp; private directory</Link><span className="kicker">{dossier.companyType==="upcoming_ipo"?"UPCOMING IPO DOSSIER":"PRIVATE COMPANY DOSSIER"}</span><h1>{dossier.companyName}</h1><div><strong>{dossier.proposedTicker||"No public ticker"}</strong>{dossier.proposedExchange&&<span>{dossier.proposedExchange}</span>}{dossier.expectedIpoDate&&<span>Expected IPO {dossier.expectedIpoDate}</span>}</div></div></section>
    <section className="container emerging-dossier-layout"><article><section><span className="kicker">WHAT IS VERIFIED</span><h2>Business snapshot</h2><p className="emerging-lede">{dossier.summary}</p></section><section><span className="kicker">WHY IT BELONGS HERE</span><h2>Research relevance</h2><p>{dossier.whyItMatters}</p></section><section><span className="kicker">PRIMARY MATERIALS</span><h2>Source record</h2><div className="emerging-source-list"><a href={dossier.primarySourceUrl} target="_blank" rel="noreferrer"><strong>Primary company or SEC source</strong><span>Open original evidence ↗</span></a><a href={dossier.websiteUrl} target="_blank" rel="noreferrer"><strong>Official company website</strong><span>Visit company ↗</span></a>{dossier.roadshowStoragePath&&<a href={`/api/roadshows/${dossier.supabaseContributionId}`}><strong>{dossier.roadshowTitle||"Roadshow presentation"}</strong><span>Download approved PDF ↗</span></a>}{dossier.roadshowSourceUrl&&<a href={dossier.roadshowSourceUrl} target="_blank" rel="noreferrer"><strong>{dossier.roadshowTitle||"Official roadshow material"}</strong><span>Open issuer source ↗</span></a>}</div></section></article><aside><div><small>EDITORIAL STATUS</small><strong>Approved</strong><p>Verified by @{dossier.verifiedBy}</p></div><div><small>CONTRIBUTOR</small><strong>@{dossier.contributorUsername||"member"}</strong><p>Source and disclosure record retained.</p></div><Link href={`/contribute?type=${encodeURIComponent(dossier.companyType==="upcoming_ipo"?"Upcoming IPO dossier":"Private company dossier")}`}>Contribute an update →</Link></aside></section>
  </main>;
}
