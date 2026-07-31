"use client";

import { useEffect, useState } from "react";
import { authenticatedFetch, loginPath } from "./supabase-browser";

export function WatchlistButton({ ticker }: { ticker: string }) {
  const [watching, setWatching] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    authenticatedFetch("/api/watchlist")
      .then(async (response) => {
        if (response.status === 401) { setReady(false); return; }
        const data = await response.json() as { items?: Array<{ ticker: string }> };
        setWatching(Boolean(data.items?.some((item) => item.ticker === ticker)));
        setReady(true);
      })
      .catch(() => setReady(true));
  }, [ticker]);

  async function toggle() {
    if (!ready) {
      window.location.href = loginPath(window.location.pathname);
      return;
    }
    setBusy(true);
    const response = await authenticatedFetch("/api/watchlist", {
      method: watching ? "DELETE" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ticker }),
    });
    if (response.status === 401) {
      window.location.href = loginPath(window.location.pathname);
      return;
    }
    if (response.ok) setWatching(!watching);
    setBusy(false);
  }

  return <button className={watching ? "watch-button watching" : "watch-button"} onClick={toggle} disabled={busy}>
    {busy ? "Saving…" : watching ? "✓ Watching" : ready ? "+ Add to watchlist" : "Sign in to watch"}
  </button>;
}
