import { Header } from "../ui";
import { ContributionClient } from "./ContributionClient";

export default async function ContributePage({ searchParams }: { searchParams: Promise<{ ticker?: string | string[]; type?: string | string[]; claim?: string | string[]; why?: string | string[]; source?: string | string[] }> }) {
  const resolvedSearchParams = await searchParams;
  const suppliedTicker = resolvedSearchParams.ticker;
  const suppliedType = resolvedSearchParams.type;
  const initialTicker = (Array.isArray(suppliedTicker) ? suppliedTicker[0] : suppliedTicker)?.toUpperCase().slice(0, 12);
  const initialType = (Array.isArray(suppliedType) ? suppliedType[0] : suppliedType)?.slice(0, 80);
  const value = (key: "claim" | "why" | "source", limit: number) => {
    const supplied = resolvedSearchParams[key];
    return (Array.isArray(supplied) ? supplied[0] : supplied)?.slice(0, limit);
  };
  return <main><Header/><section className="contribute-hero"><div className="container"><span className="kicker">COMMUNITY INTELLIGENCE</span><h1>Contribute evidence,<br/>not another opinion.</h1><p>Every submission is attributed to your username, structured, sourced, disclosed, and held for editorial review before approval.</p></div></section><ContributionClient initialTicker={initialTicker} initialType={initialType} initialDraft={{ claim: value("claim", 1000), whyItMatters: value("why", 1200), sourceUrl: value("source", 2000) }}/></main>;
}
