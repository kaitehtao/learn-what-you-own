import type { Metadata } from "next";
import { Header } from "../ui";
import { CompTableBuilder } from "./CompTableBuilder";

export const metadata: Metadata = {
  title: "Build a Stock Comp Table — Learn What You Own",
  description: "Compare up to ten public companies using current market values and SEC-reported fundamentals.",
};

export const dynamic = "force-dynamic";

export default async function CompsPage({ searchParams }: { searchParams: Promise<{ tickers?: string | string[] }> }) {
  const raw = (await searchParams).tickers;
  const initial = (Array.isArray(raw) ? raw[0] : raw) ?? "NVDA,AMD,AVGO,INTC";
  return <main className="comps-page">
    <Header />
    <section className="comps-hero"><div className="container">
      <span className="kicker">COMPARABLE COMPANY WORKBENCH</span>
      <h1>Build a comp table you can actually use.</h1>
      <p>Add up to ten tickers. Compare current scale, valuation, profitability, and balance-sheet resilience against the same SEC-grounded definitions.</p>
      <div className="comps-principles"><span>Current market values</span><span>SEC-reported fundamentals</span><span>No invented multiples</span><span>Shareable &amp; exportable</span></div>
    </div></section>
    <CompTableBuilder initialTickers={initial} />
  </main>;
}
