"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "../supabase-browser";
import { Header } from "../ui";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [form, setForm] = useState({ email: "", password: "", username: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const returnTo = useMemo(() => {
    if (typeof window === "undefined") return "/account";
    const value = new URLSearchParams(window.location.search).get("returnTo") ?? "/account";
    return value.startsWith("/") && !value.startsWith("//") ? value : "/account";
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError(""); setNotice("");
    try {
      const supabase = await getSupabaseBrowserClient();
      if (mode === "reset") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(form.email.trim(), {
          redirectTo: `${window.location.origin}/auth/callback?returnTo=${encodeURIComponent("/auth/reset-password")}`,
        });
        if (resetError) throw resetError;
        setNotice("If an account exists for that email, a secure password-reset link is on its way. Check your inbox and spam folder.");
      } else if (mode === "signup") {
        if (!/^[A-Za-z0-9_]{3,24}$/.test(form.username)) throw new Error("Username must be 3–24 letters, numbers, or underscores.");
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: form.email.trim(), password: form.password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback?returnTo=${encodeURIComponent(returnTo)}`, data: { username: form.username.trim(), name: form.username.trim() } },
        });
        if (signUpError) throw signUpError;
        if (data.session) window.location.href = returnTo;
        else setNotice(`Verification email sent to ${form.email.trim()}. Open the link to activate your account.`);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: form.email.trim(), password: form.password });
        if (signInError) throw signInError;
        window.location.href = returnTo;
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to continue.");
    } finally { setBusy(false); }
  }

  async function continueWithGoogle() {
    setBusy(true); setError("");
    try {
      const supabase = await getSupabaseBrowserClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback?returnTo=${encodeURIComponent(returnTo)}`, queryParams: { prompt: "select_account" } } });
      if (oauthError) throw oauthError;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to connect Google.");
      setBusy(false);
    }
  }

  return <main><Header/><section className="auth-shell"><div className="auth-intro"><span className="kicker">MEMBER ACCESS</span><h1>Keep your research connected.</h1><p>Create a verified account to build a private watchlist and contribute sourced insights under your chosen username.</p><ul><li>Email verification for every email account</li><li>Google sign-in supported</li><li>Private watchlists protected by row-level security</li><li>Public insights show your username—not your email</li></ul></div><div className="auth-card"><div className="auth-tabs"><button className={mode==="signin"?"active":""} onClick={()=>{setMode("signin");setError("");setNotice("")}}>Sign in</button><button className={mode==="signup"?"active":""} onClick={()=>{setMode("signup");setError("");setNotice("")}}>Create account</button></div>{mode==="reset"&&<div className="auth-card-heading"><span className="kicker">ACCOUNT RECOVERY</span><h2>Reset your password.</h2><p>We’ll email a secure link to the address connected to your account.</p></div>}{mode!=="reset"&&<><button className="google-auth" onClick={continueWithGoogle} disabled={busy}><span>G</span> Continue with Google</button><div className="auth-divider"><span>or use email</span></div></>}<form onSubmit={submit}>{mode==="signup"&&<label>USERNAME<input required minLength={3} maxLength={24} pattern="[A-Za-z0-9_]+" autoComplete="username" value={form.username} onChange={event=>setForm({...form,username:event.target.value})} placeholder="owner_researcher"/><small>3–24 letters, numbers, or underscores. This appears with your insights.</small></label>}<label>EMAIL<input required type="email" autoComplete="email" value={form.email} onChange={event=>setForm({...form,email:event.target.value})} placeholder="you@example.com"/></label>{mode!=="reset"&&<label>PASSWORD<input required type="password" minLength={8} autoComplete={mode==="signup"?"new-password":"current-password"} value={form.password} onChange={event=>setForm({...form,password:event.target.value})} placeholder="At least 8 characters"/></label>}{mode==="signin"&&<button className="forgot-password" type="button" onClick={()=>{setMode("reset");setError("");setNotice("")}}>Forgot password?</button>}{error&&<p className="form-error">{error}</p>}{notice&&<p className="auth-notice">{notice}</p>}<button className="submit-contribution" disabled={busy}>{busy?"Please wait…":mode==="signup"?"Create verified account →":mode==="reset"?"Email reset link →":"Sign in →"}</button></form>{mode==="reset"&&<button className="auth-back" type="button" onClick={()=>{setMode("signin");setError("");setNotice("")}}>← Back to sign in</button>}<p className="auth-terms">By continuing, you agree to contribute responsibly and understand that published research is educational, not investment advice.</p><Link href="/">← Return to research</Link></div></section></main>;
}
