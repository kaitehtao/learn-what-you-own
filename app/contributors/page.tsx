import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "../ui";
import { ContributorsClient } from "./ContributorsClient";

export const metadata: Metadata = {
  title: "Investment Research Contributors | Learn What You Own",
  description: "Discover contributors recognized for source-linked investment research, corrections, company relationships, and useful product improvements.",
  alternates: { canonical: "https://learnwhatyouown.com/contributors" },
};

export default function ContributorsPage() {
  return <main className="contributors-page"><Header />
    <section className="contributors-hero"><div className="container"><span className="kicker">COMMUNITY RECOGNITION</span><h1>Evidence earns influence.</h1><p>We highlight contributors who improve the permanent research record. Points reward verified value—not posting frequency, popularity, or market opinions without sources.</p><div><Link className="button" href="/contribute">Make a contribution</Link><Link href="/feedback">Suggest a feature →</Link></div></div></section>
    <section className="container contributors-content"><header><div><span className="kicker">LEADERBOARD</span><h2>Top contributors</h2></div><p>Only moderator-approved research, corrections, relationships, dossiers, and selected product ideas earn points.</p></header><ContributorsClient />
      <div className="reward-rules"><article><small>100–175 POINTS</small><h3>Research that lasts</h3><p>Sourced contributions, corrections, supply-chain relationships, and company dossiers earn different awards after editorial approval.</p></article><article><small>40 + 75 POINTS</small><h3>Ideas that ship</h3><p>A feature request earns recognition when it enters the plan and an additional award when it reaches the public product.</p></article><article><small>1 CREDIT / 100 POINTS</small><h3>Owner Credits</h3><p>Non-transferable credits have no cash value. They unlock community recognition, spotlights, and future participation perks.</p></article></div>
    </section>
  </main>;
}
