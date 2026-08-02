"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Contributor = { rank: number; username: string; points: number; ownerCredits: number; approvedAwards: number; level: string };

export function ContributorsClient() {
  const [contributors, setContributors] = useState<Contributor[] | null>(null);
  useEffect(() => { fetch("/api/contributors").then(async response => setContributors((await response.json() as { contributors: Contributor[] }).contributors)).catch(() => setContributors([])); }, []);
  if (!contributors) return <div className="contributors-state">Loading the contributor rankings…</div>;
  if (!contributors.length) return <div className="contributors-state"><strong>The leaderboard is ready.</strong><p>The first moderator-approved contributions will establish the rankings.</p><Link className="button" href="/contribute">Contribute research</Link></div>;
  return <div className="contributor-board">
    <div className="contributor-labels"><span>RANK</span><span>CONTRIBUTOR</span><span>LEVEL</span><span>APPROVED</span><span>POINTS</span><span>CREDITS</span></div>
    {contributors.map(item => <Link href={`/members/${encodeURIComponent(item.username)}`} key={item.username} className={item.rank <= 3 ? `top-contributor rank-${item.rank}` : ""}><span>#{item.rank}</span><strong>@{item.username}</strong><em>{item.level}</em><span>{item.approvedAwards}</span><b>{item.points.toLocaleString()}</b><span>{item.ownerCredits}</span></Link>)}
  </div>;
}
