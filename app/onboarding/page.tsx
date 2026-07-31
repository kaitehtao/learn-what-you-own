"use client";

import { FormEvent, useEffect, useState } from "react";
import { authenticatedFetch, loginPath } from "../supabase-browser";
import { Header } from "../ui";

export default function OnboardingPage() {
  const [form, setForm] = useState({ username: "", displayName: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    authenticatedFetch("/api/account").then(async response => {
      if (response.status === 401) return void (window.location.href = loginPath("/onboarding"));
      if (!response.ok) return;
      const data = await response.json() as { profile: { username: string; display_name: string; onboarding_complete: boolean } };
      if (data.profile.onboarding_complete) window.location.replace("/account");
      else setForm({ username: "", displayName: data.profile.display_name ?? "" });
    });
  }, []);
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    const response = await authenticatedFetch("/api/account", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
    const data = await response.json() as { error?: string };
    if (!response.ok) { setError(data.error ?? "Unable to save that username."); setBusy(false); return; }
    const requested = new URLSearchParams(window.location.search).get("returnTo") ?? "/account";
    window.location.href = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/account";
  }
  return <main><Header/><section className="onboarding-shell"><div><span className="kicker">ONE LAST STEP</span><h1>Choose your public username.</h1><p>Your email remains private. Approved insights and discussion contributions appear under this username.</p><form onSubmit={save}><label>USERNAME<input required minLength={3} maxLength={24} pattern="[A-Za-z0-9_]+" value={form.username} onChange={event=>setForm({...form,username:event.target.value})} placeholder="owner_researcher"/><small>Letters, numbers, and underscores only.</small></label><label>DISPLAY NAME <em>optional</em><input maxLength={80} value={form.displayName} onChange={event=>setForm({...form,displayName:event.target.value})} placeholder="How you want to be addressed privately"/></label>{error&&<p className="form-error">{error}</p>}<button className="submit-contribution" disabled={busy}>{busy?"Saving…":"Open my account →"}</button></form></div></section></main>;
}
