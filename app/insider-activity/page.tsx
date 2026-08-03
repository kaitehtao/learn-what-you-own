import type { Metadata } from "next";
import { Header } from "../ui";
import { InsiderActivityScreen } from "./InsiderActivityScreen";

export const metadata: Metadata = {
  title: "Insider Buys & Sells | Learn What You Own",
  description: "Ranked open-market insider purchases and sales from SEC Forms 3, 4, and 5 across the Learn What You Own research universe.",
};

export default function InsiderActivityPage() {
  return <main>
    <Header />
    <section className="insider-activity-hero">
      <div className="container insider-activity-hero-grid">
        <div>
          <span className="kicker">SEC OWNERSHIP INTELLIGENCE</span>
          <h1>See where insiders are<br />buying—and selling.</h1>
          <p>Open-market transactions reported on SEC Forms 3, 4, and 5, ranked across the complete Learn What You Own research universe.</p>
        </div>
        <aside>
          <strong>Primary-source research</strong>
          <span>Every transaction links to the original SEC filing. Rankings use reported transaction value, not sentiment or promotional scoring.</span>
        </aside>
      </div>
    </section>
    <InsiderActivityScreen />
  </main>;
}
