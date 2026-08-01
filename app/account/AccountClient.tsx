"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authenticatedFetch, getSupabaseBrowserClient, loginPath } from "../supabase-browser";

type Account = { email?: string; profile: { username: string; display_name: string; role: string; onboarding_complete: boolean; created_at: string } };

export function AccountClient() {
  const [account, setAccount] = useState<Account | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    authenticatedFetch("/api/account").then(async response => {
      if (response.status === 401) return void (window.location.href = loginPath("/account"));
      const data = await response.json() as Account & { error?: string };
      if (!response.ok) return setError(data.error ?? "Unable to load your account.");
      if (!data.profile.onboarding_complete) return void (window.location.href = "/onboarding");
      setAccount(data);
    }).catch(caught => setError(caught instanceof Error ? caught.message : "Unable to load your account."));
  }, []);
  async function signOut() {
    const supabase = await getSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }
  if (error) return <section className="container account-layout"><p className="form-error">{error}</p></section>;
  if (!account) return <section className="container account-layout"><div className="member-loading">Loading your account…</div></section>;
  const name = account.profile.display_name || account.profile.username;
  return <section className="container account-layout"><aside className="account-card"><span className="account-avatar">{name.slice(0,1).toUpperCase()}</span><h2>{name}</h2><strong>@{account.profile.username}</strong><p>{account.email}</p><em>{account.profile.role}</em><button onClick={signOut}>Sign out</button></aside><div className="account-actions"><Link href="/messages"><span>01</span><div><strong>Private messages</strong><p>Talk directly with another member without exposing either email address.</p></div><i>→</i></Link><Link href="/watchlist"><span>02</span><div><strong>My watchlist</strong><p>Follow companies and see research-relevant changes.</p></div><i>→</i></Link><Link href="/portfolio"><span>03</span><div><strong>My portfolio</strong><p>Add holdings to connect research with what you own.</p></div><i>→</i></Link><Link href="/contribute"><span>04</span><div><strong>My contributions</strong><p>Submit sourced insights as @{account.profile.username} and track moderation.</p></div><i>→</i></Link>{(account.profile.role==="admin"||account.profile.role==="editor")&&<Link href="/admin"><span>05</span><div><strong>Editorial desk</strong><p>Review community research before it is approved.</p></div><i>→</i></Link>}</div></section>;
}
