"use client";

import { useEffect, useState } from "react";
import { followingLabel } from "./company-followers";

type CompanyFollower = { ticker: string; follower_count?: number };

export function CompanyFollowerCount({ ticker }: { ticker: string }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/company-followers", { cache: "no-store" }).then(async (response) => {
      if (!response.ok) throw new Error("Follower count unavailable");
      const payload = await response.json() as { companies?: CompanyFollower[] };
      if (active) setCount(payload.companies?.find((item) => item.ticker === ticker)?.follower_count ?? 0);
    }).catch(() => {
      if (active) setCount(null);
    });

    function update(event: Event) {
      const detail = (event as CustomEvent<{ ticker: string; delta: number }>).detail;
      if (detail?.ticker === ticker) setCount((current) => Math.max(0, (current ?? 0) + detail.delta));
    }
    window.addEventListener("company-following-change", update);
    return () => {
      active = false;
      window.removeEventListener("company-following-change", update);
    };
  }, [ticker]);

  return <><strong aria-live="polite">{count === null ? "—" : count.toLocaleString()}</strong><span>{count === null ? "Watchlist count unavailable" : followingLabel(count)}</span></>;
}
