"use client";

import { useEffect, useState } from "react";
import { authenticatedFetch, loginPath } from "./supabase-browser";

export function ResearchDemandButton({ ticker }: { ticker: string }) {
  const [voted, setVoted] = useState(false);
  const [votes, setVotes] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    authenticatedFetch("/api/research-demand", { cache: "no-store" }).then(async (response) => {
      if (!response.ok) return;
      const payload = await response.json() as { companies?: Array<{ ticker: string; vote_count: number }>; viewerVotes?: string[] };
      setVoted(Boolean(payload.viewerVotes?.includes(ticker)));
      setVotes(payload.companies?.find((item) => item.ticker === ticker)?.vote_count ?? 0);
    }).catch(() => undefined);
  }, [ticker]);

  async function toggle() {
    setBusy(true);
    try {
      const response = await authenticatedFetch("/api/research-demand", { method: voted ? "DELETE" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ticker }) });
      if (response.status === 401) { window.location.href = loginPath(window.location.pathname); return; }
      if (response.ok) { setVotes((count) => Math.max(0, count + (voted ? -1 : 1))); setVoted(!voted); }
    } finally { setBusy(false); }
  }

  return <button className={`research-demand-button ${voted ? "voted" : ""}`} disabled={busy} onClick={toggle}>{busy ? "Saving…" : voted ? `✓ Research requested · ${votes}` : `▲ Request deeper research${votes ? ` · ${votes}` : ""}`}</button>;
}
