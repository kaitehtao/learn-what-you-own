import type { Metadata } from "next";
import { CompanyConversations } from "../CompanyConversations";
import { Header } from "../ui";

export const metadata: Metadata = {
  title: "Investment Conversations | Learn What You Own",
  description: "Compare moderated, evidence-linked company research with the live Stocktwits market pulse without mixing the two sources.",
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function safeTicker(value: string | undefined) {
  const ticker = (value ?? "AAPL").toUpperCase().replace(/[^A-Z0-9.-]/g, "").slice(0, 16);
  return ticker || "AAPL";
}

export default async function ConversationsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ticker = safeTicker(first((await searchParams).ticker));
  return <main className="conversations-page"><Header />
    <section className="conversations-hero"><div className="container"><span className="kicker">RESEARCH COMMUNITY · MARKET PULSE</span><h1>Conversations with<br/>their sources intact.</h1><p>Choose a ticker, review moderated LearnWhatYouOwn research, and compare it with Stocktwits activity without confusing social sentiment for verified evidence.</p><form action="/conversations"><label htmlFor="conversation-ticker">Company ticker</label><div><span>$</span><input id="conversation-ticker" name="ticker" defaultValue={ticker} maxLength={16} autoCapitalize="characters"/><button>Open conversations →</button></div></form></div></section>
    <div className="container conversations-shell"><CompanyConversations ticker={ticker}/></div>
  </main>;
}
