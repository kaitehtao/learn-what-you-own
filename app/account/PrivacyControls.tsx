"use client";

import { useEffect, useState } from "react";
import { authenticatedFetch } from "../supabase-browser";

type DeletionRequest = { id: number; status: string; requested_at: string; resolved_at: string | null };

export function PrivacyControls({ username }: { username: string }) {
  const [request, setRequest] = useState<DeletionRequest | null>(null);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    authenticatedFetch("/api/account/deletion-request", { cache: "no-store" }).then(async response => {
      if (!response.ok) return;
      const result = await response.json() as { request?: DeletionRequest | null };
      setRequest(result.request ?? null);
    });
  }, []);

  async function downloadExport(format: "json" | "markdown" = "json") {
    setBusy("export"); setMessage("");
    const response = await authenticatedFetch(`/api/account/export${format === "markdown" ? "?format=markdown" : ""}`, { cache: "no-store" });
    if (!response.ok) {
      const result = await response.json() as { error?: string };
      setMessage(result.error ?? "Unable to prepare your data export."); setBusy(""); return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = response.headers.get("content-disposition")?.match(/filename="([^"]+)"/)?.[1] ?? `learn-what-you-own-data.${format === "markdown" ? "md" : "json"}`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage(format === "markdown" ? "Your portable research Markdown has downloaded." : "Your complete account data export has downloaded."); setBusy("");
  }

  async function requestDeletion() {
    const confirmation = window.prompt(`Account deletion removes your private workspace and public contributions after administrator review. Type REQUEST DELETE @${username} to continue.`);
    if (!confirmation) return;
    setBusy("delete"); setMessage("");
    const response = await authenticatedFetch("/api/account/deletion-request", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ confirmation }) });
    const result = await response.json() as { error?: string; request?: DeletionRequest };
    if (!response.ok) setMessage(result.error ?? "Unable to submit the deletion request.");
    else { setRequest(result.request ?? null); setMessage("Deletion request received. An administrator will review it before any data is removed."); }
    setBusy("");
  }

  async function cancelDeletion() {
    setBusy("cancel"); setMessage("");
    const response = await authenticatedFetch("/api/account/deletion-request", { method: "DELETE" });
    const result = await response.json() as { error?: string };
    if (!response.ok) setMessage(result.error ?? "Unable to cancel the deletion request.");
    else { setRequest(null); setMessage("Your account deletion request was cancelled."); }
    setBusy("");
  }

  const pending = request?.status === "requested";
  return <section className="account-privacy-controls">
    <header><span className="kicker">DATA &amp; PRIVACY</span><h2>Keep control of your information.</h2><p>Download a machine-readable copy of your account, research, portfolio, messages, and uploaded-file links. Account deletion requires administrator review to prevent accidental loss.</p></header>
    <div>
      <button type="button" onClick={() => void downloadExport("json")} disabled={Boolean(busy)}>{busy === "export" ? "Preparing export…" : "Download all data (JSON)"}</button>
      <button type="button" onClick={() => void downloadExport("markdown")} disabled={Boolean(busy)}>{busy === "export" ? "Preparing export…" : "Export research (Markdown)"}</button>
      {pending
        ? <button type="button" className="privacy-cancel-delete" onClick={() => void cancelDeletion()} disabled={Boolean(busy)}>{busy === "cancel" ? "Cancelling…" : "Cancel deletion request"}</button>
        : <button type="button" className="privacy-request-delete" onClick={() => void requestDeletion()} disabled={Boolean(busy)}>{busy === "delete" ? "Submitting…" : "Request account deletion"}</button>}
    </div>
    {pending && <small>Deletion requested {new Date(request.requested_at).toLocaleDateString()}. No information has been removed yet.</small>}
    {message && <p role="status">{message}</p>}
  </section>;
}
