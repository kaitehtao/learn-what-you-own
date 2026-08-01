"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const VISITOR_KEY = "lwy:anonymous-visitor-id";

function anonymousVisitorId() {
  const existing = window.localStorage.getItem(VISITOR_KEY);
  if (existing) return existing;
  const created = crypto.randomUUID();
  window.localStorage.setItem(VISITOR_KEY, created);
  return created;
}

export function VisitorTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || navigator.doNotTrack === "1") return;
    let referrerHost = "";
    try {
      const referrer = document.referrer ? new URL(document.referrer) : null;
      if (referrer && referrer.origin !== window.location.origin) referrerHost = referrer.hostname;
    } catch { /* Ignore malformed browser referrers. */ }
    fetch("/api/analytics/visit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ visitorId: anonymousVisitorId(), path: pathname, referrerHost }),
      keepalive: true,
    }).catch(() => undefined);
  }, [pathname]);
  return null;
}
