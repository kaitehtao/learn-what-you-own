import Link from "next/link";
import { chatGPTSignOutPath } from "../chatgpt-auth";
import { requireMemberProfile } from "../member";
import { Header } from "../ui";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const profile = await requireMemberProfile("/account");
  return <main><Header/><section className="account-hero"><div className="container"><span className="kicker">MEMBER ACCOUNT</span><h1>Welcome, {profile.displayName}.</h1><p>Your research follows you: saved companies, portfolio context, contributions, disclosures, and editorial history.</p></div></section>
    <section className="container account-layout">
      <aside className="account-card"><span className="account-avatar">{profile.displayName.slice(0,1).toUpperCase()}</span><h2>{profile.displayName}</h2><p>{profile.email}</p><em>{profile.role}</em><a href={chatGPTSignOutPath("/")}>Sign out</a></aside>
      <div className="account-actions">
        <Link href="/watchlist"><span>01</span><div><strong>My watchlist</strong><p>Follow companies and see research-relevant changes.</p></div><i>→</i></Link>
        <Link href="/portfolio"><span>02</span><div><strong>My portfolio</strong><p>Add holdings to connect research with what you own.</p></div><i>→</i></Link>
        <Link href="/contribute"><span>03</span><div><strong>My contributions</strong><p>Submit sourced research and track moderation status.</p></div><i>→</i></Link>
        {(profile.role === "admin" || profile.role === "editor") && <Link href="/admin"><span>04</span><div><strong>Editorial desk</strong><p>Review community research before it is approved.</p></div><i>→</i></Link>}
      </div>
    </section>
  </main>;
}
