"use client";

import { FormEvent, useEffect, useState } from "react";
import { authenticatedFetch, getSupabaseBrowserClient, loginPath } from "../supabase-browser";
import { Header } from "../ui";

export default function OnboardingPage() {
  const [form, setForm] = useState({ username: "", displayName: "", phoneNumber: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    authenticatedFetch("/api/account").then(async response => {
      if (response.status === 401) return void (window.location.href = loginPath("/onboarding"));
      if (!response.ok) return;
      const data = await response.json() as { profile: { username: string; display_name: string; onboarding_complete: boolean } };
      if (data.profile.onboarding_complete) window.location.replace("/account");
      else setForm({ username: "", displayName: data.profile.display_name ?? "", phoneNumber: "" });
    });
  }, []);
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    const rawPhone = form.phoneNumber.trim();
    const digits = rawPhone.replace(/\D/g, "");
    const phoneNumber = !rawPhone ? "" : rawPhone.startsWith("+") ? `+${digits}` : digits.length === 10 ? `+1${digits}` : digits.length === 11 && digits.startsWith("1") ? `+${digits}` : rawPhone;
    if (phoneNumber && !/^\+[1-9][0-9]{7,14}$/.test(phoneNumber)) { setError("Enter a valid phone number with country code."); setBusy(false); return; }
    if (phoneNumber) {
      const supabase = await getSupabaseBrowserClient();
      const { error: phoneError } = await supabase.auth.updateUser({ data: { phone_number: phoneNumber, sms_marketing_consent: false } });
      if (phoneError) { setError(phoneError.message); setBusy(false); return; }
    }
    const response = await authenticatedFetch("/api/account", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ username: form.username, displayName: form.displayName }) });
    const data = await response.json() as { error?: string };
    if (!response.ok) { setError(data.error ?? "Unable to save that username."); setBusy(false); return; }
    const requested = new URLSearchParams(window.location.search).get("returnTo") ?? "/account";
    window.location.href = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/account";
  }
  return <main><Header/><section className="onboarding-shell"><div><span className="kicker">ONE LAST STEP</span><h1>Choose your public username.</h1><p>Your email and phone number remain private. Approved insights and discussion contributions appear under this username.</p><form onSubmit={save}><label>USERNAME<input required minLength={3} maxLength={24} pattern="[A-Za-z0-9_]+" value={form.username} onChange={event=>setForm({...form,username:event.target.value})} placeholder="owner_researcher"/><small>Letters, numbers, and underscores only.</small></label><label>DISPLAY NAME <em>optional</em><input maxLength={80} value={form.displayName} onChange={event=>setForm({...form,displayName:event.target.value})} placeholder="How you want to be addressed privately"/></label><label>PHONE NUMBER <em>optional</em><input type="tel" autoComplete="tel" value={form.phoneNumber} onChange={event=>setForm({...form,phoneNumber:event.target.value})} placeholder="+1 212 555 0123"/><small>Used only for account support and future security features—not marketing texts.</small></label>{error&&<p className="form-error">{error}</p>}<button className="submit-contribution" disabled={busy}>{busy?"Saving…":"Open my account →"}</button></form></div></section></main>;
}
