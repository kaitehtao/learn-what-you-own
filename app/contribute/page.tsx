import { Header } from "../ui";
import { ContributionClient } from "./ContributionClient";

export default async function ContributePage({ searchParams }: { searchParams: Promise<{ ticker?: string | string[] }> }) {
  const suppliedTicker = (await searchParams).ticker;
  const initialTicker = (Array.isArray(suppliedTicker) ? suppliedTicker[0] : suppliedTicker)?.toUpperCase().slice(0, 12);
  return <main><Header/><section className="contribute-hero"><div className="container"><span className="kicker">COMMUNITY INTELLIGENCE</span><h1>Contribute evidence,<br/>not another opinion.</h1><p>Every submission is attributed to your username, structured, sourced, disclosed, and held for editorial review before approval.</p></div></section><ContributionClient initialTicker={initialTicker}/></main>;
}
