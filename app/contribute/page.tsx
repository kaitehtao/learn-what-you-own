import { requireMemberProfile } from "../member";
import { Header } from "../ui";
import { ContributionClient } from "./ContributionClient";

export const dynamic = "force-dynamic";

export default async function ContributePage() {
  const profile = await requireMemberProfile("/contribute");
  return <main><Header/><section className="contribute-hero"><div className="container"><span className="kicker">COMMUNITY INTELLIGENCE</span><h1>Contribute evidence,<br/>not another opinion.</h1><p>Every submission is attributed, structured, sourced, disclosed, and held for editorial review before approval.</p></div></section><ContributionClient displayName={profile.displayName}/></main>;
}
