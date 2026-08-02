"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProfileAvatar } from "../ProfileAvatar";
import { authenticatedFetch, getSupabaseBrowserClient, loginPath } from "../supabase-browser";
import { RewardsSummary } from "./RewardsSummary";

type Account = {
  email?: string;
  followerCount: number;
  followingCount: number;
  profile: {
    username: string;
    display_name: string;
    role: string;
    onboarding_complete: boolean;
    avatar_url?: string | null;
  };
};

const actions = [
  ["/account/profile", "Edit public profile", "Add a photo and short biography, and choose how you appear to the research community."],
  ["/notebook", "My research notebook", "Keep private company notes, sources, excerpts, questions, catalysts, risks, and research tasks."],
  ["/notifications", "Notifications & email alerts", "Review unread activity and choose how message alerts should reach you."],
  ["/messages", "Member messages", "Send private correspondence or post a public note under your username."],
  ["/watchlist", "My watchlist", "Follow companies and see research-relevant changes."],
  ["/portfolio", "My portfolio", "Add holdings to connect research with what you own."],
  ["/contribute", "My contributions", "Submit sourced insights and track moderation."],
  ["/feedback", "Product feedback", "Suggest features and improvements, then follow @Yourhost’s review status."],
] as const;

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

  return <section className="container account-layout">
    <aside className="account-card">
      <ProfileAvatar className="account-avatar" name={name} photoUrl={account.profile.avatar_url} />
      <h2>{name}</h2><strong>@{account.profile.username}</strong><p>{account.email}</p>
      <div className="account-network">
        <Link href={`/members/${encodeURIComponent(account.profile.username)}`}><strong>{account.followerCount}</strong><span>Followers</span></Link>
        <Link href={`/members/${encodeURIComponent(account.profile.username)}`}><strong>{account.followingCount}</strong><span>Following</span></Link>
      </div>
      <Link className="public-profile-link" href={`/members/${encodeURIComponent(account.profile.username)}`}>View public profile →</Link>
      <em>{account.profile.role}</em><button onClick={signOut}>Sign out</button>
    </aside>
    <div className="account-workspace-column">
      <RewardsSummary />
      <div className="account-actions">
      {actions.map(([href, title, description], index) => <Link href={href} key={href}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{title}</strong><p>{href === "/contribute" ? `${description} as @${account.profile.username}.` : description}</p></div><i>→</i></Link>)}
      {(account.profile.role === "admin" || account.profile.role === "editor") && <Link href="/admin"><span>09</span><div><strong>{account.profile.role === "admin" ? "Administrator dashboard" : "Editorial desk"}</strong><p>{account.profile.role === "admin" ? "Manage audience analytics, account invitations, roles, and access." : "Review community research before it is approved."}</p></div><i>→</i></Link>}
      </div>
    </div>
  </section>;
}
