"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "../../supabase-browser";
import { Header } from "../../ui";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getSupabaseBrowserClient()
      .then(async supabase => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!active) return;
        if (!session) setError("This password-reset link is invalid or has expired. Request a new link from the sign-in page.");
        else setReady(true);
      })
      .catch(caught => active && setError(caught instanceof Error ? caught.message : "Unable to verify this reset link."));
    return () => { active = false; };
  }, []);

  async function updatePassword(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (password.length < 8) return setError("Your new password must be at least 8 characters.");
    if (password !== confirmation) return setError("The passwords do not match.");
    setBusy(true);
    try {
      const supabase = await getSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      window.location.replace("/account");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update your password.");
      setBusy(false);
    }
  }

  return <main><Header/><section className="onboarding-shell"><div><span className="kicker">ACCOUNT RECOVERY</span><h1>Choose a new password.</h1><p>Use at least eight characters and avoid reusing a password from another service.</p>{error&&<p className="form-error">{error}</p>}{ready&&<form onSubmit={updatePassword}><label>NEW PASSWORD<input required type="password" minLength={8} autoComplete="new-password" value={password} onChange={event=>setPassword(event.target.value)} placeholder="At least 8 characters"/></label><label>CONFIRM NEW PASSWORD<input required type="password" minLength={8} autoComplete="new-password" value={confirmation} onChange={event=>setConfirmation(event.target.value)} placeholder="Enter it again"/></label><button className="submit-contribution" disabled={busy}>{busy?"Updating…":"Set new password →"}</button></form>}<Link className="reset-login-link" href="/login">← Return to sign in</Link></div></section></main>;
}
