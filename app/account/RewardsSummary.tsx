"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authenticatedFetch } from "../supabase-browser";

type Rewards = {
  points: number;
  ownerCredits: number;
  awards: number;
  level: { name: string; threshold: number; progress: number; next: { name: string; threshold: number } | null };
  recent: Array<{ points: number; description: string; createdAt: string }>;
  currencyNotice: string;
};

export function RewardsSummary() {
  const [rewards, setRewards] = useState<Rewards | null>(null);
  useEffect(() => { authenticatedFetch("/api/rewards").then(async response => { if (response.ok) setRewards(await response.json() as Rewards); }); }, []);
  if (!rewards) return <section className="account-rewards account-rewards-loading">Loading contributor rewards…</section>;
  return <section className="account-rewards">
    <header><div><span className="kicker">CONTRIBUTOR REWARDS</span><h2>{rewards.level.name}</h2><p>Points are earned only after moderators approve a contribution or product idea.</p></div><Link href="/contributors">View leaderboard →</Link></header>
    <div className="reward-metrics"><div><small>POINTS</small><strong>{rewards.points.toLocaleString()}</strong></div><div><small>OWNER CREDITS</small><strong>{rewards.ownerCredits.toLocaleString()}</strong></div><div><small>VERIFIED AWARDS</small><strong>{rewards.awards}</strong></div></div>
    <div className="reward-progress"><span style={{ width: `${rewards.level.progress}%` }}/></div>
    <p className="reward-next">{rewards.level.next ? `${rewards.level.next.threshold - rewards.points} points until ${rewards.level.next.name}.` : "You have reached the highest contributor level."}</p>
    <div className="reward-recent"><strong>Recent recognition</strong>{rewards.recent.length ? rewards.recent.slice(0, 4).map((item, index) => <div key={`${item.createdAt}-${index}`}><span>+{item.points}</span><p>{item.description}</p><time>{new Date(item.createdAt).toLocaleDateString()}</time></div>) : <p>Your first moderator-approved contribution will appear here.</p>}</div>
    <small className="reward-notice">{rewards.currencyNotice} Credits unlock recognition badges, contributor spotlights, and priority review opportunities as the rewards catalogue expands.</small>
  </section>;
}
