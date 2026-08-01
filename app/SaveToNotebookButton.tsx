"use client";

import { useState } from "react";
import { authenticatedFetch, loginPath } from "./supabase-browser";

export function SaveToNotebookButton({
  ticker,
  companyName,
  title,
  sourceTitle = "",
  sourceUrl = "",
  sourceExcerpt = "",
  body = "",
  compact = false,
}: {
  ticker: string;
  companyName?: string;
  title?: string;
  sourceTitle?: string;
  sourceUrl?: string;
  sourceExcerpt?: string;
  body?: string;
  compact?: boolean;
}) {
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function save() {
    setState("saving");
    try {
      const response = await authenticatedFetch("/api/notebook", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "capture", ticker, companyName, title: title || `${ticker} research notebook`, sourceTitle, sourceUrl, sourceExcerpt, body }),
      });
      if (response.status === 401) {
        window.location.href = loginPath(`/notebook?ticker=${encodeURIComponent(ticker)}`);
        return;
      }
      if (!response.ok) throw new Error("Unable to save");
      setState("saved");
    } catch {
      setState("error");
    }
  }

  return <button className={`save-notebook-button ${compact ? "compact" : ""} ${state}`} type="button" onClick={save} disabled={state === "saving" || state === "saved"}>
    {state === "saving" ? "Saving…" : state === "saved" ? "✓ Saved to notebook" : state === "error" ? "Try saving again" : compact ? "＋ Notebook" : "Save to private notebook"}
  </button>;
}
