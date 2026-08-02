"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ProfileAvatar } from "../../ProfileAvatar";
import { authenticatedFetch, loginPath } from "../../supabase-browser";

type ListedMember = { username?: string; display_name?: string };
type PublicMessage = { id: number; subject: string; body: string; createdAt: string; sender: ListedMember | null };
type Correction = { id: number; summary: string; sourceUrl?: string | null; createdAt: string };
type MemberProfile = {
  profile: { username: string; displayName: string; role: string; bio: string; avatarUrl?: string | null; investmentStyle: string; timeHorizon: string; expertiseAreas: string[]; credential: string; credentialVerifiedAt?: string | null; linkedinUrl?: string | null; websiteUrl?: string | null; joinedAt: string };
  researchActivity: { approvedContributions: number; companiesCovered: number; publishedCorrections: number; expertise: string[] };
  corrections: Correction[];
  followerCount: number;
  followingCount: number;
  followers: ListedMember[];
  following: ListedMember[];
  publicMessages: PublicMessage[];
  isFollowing: boolean;
  isOwnProfile: boolean;
  signedIn: boolean;
};

function shortDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export function MemberProfileClient({ username }: { username: string }) {
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [followBusy, setFollowBusy] = useState(false);
  const [openList, setOpenList] = useState<"followers" | "following" | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch(`/api/members/${encodeURIComponent(username)}`, { cache: "no-store" });
      const data = await response.json() as MemberProfile & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Member not found.");
      setMember(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Member not found.");
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(initialLoad);
  }, [load]);

  async function toggleFollow() {
    if (!member) return;
    if (!member.signedIn) return void (window.location.href = loginPath(`/members/${encodeURIComponent(member.profile.username)}`));
    setFollowBusy(true);
    setError("");
    try {
      const response = await authenticatedFetch("/api/follows", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username: member.profile.username, follow: !member.isFollowing }) });
      const data = await response.json() as { error?: string; following?: boolean; followerCount?: number };
      if (!response.ok) throw new Error(data.error ?? "Unable to update this follow.");
      setMember(current => current ? { ...current, isFollowing: Boolean(data.following), followerCount: data.followerCount ?? current.followerCount } : current);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update this follow.");
    } finally {
      setFollowBusy(false);
    }
  }

  if (loading) return <section className="member-profile-state">Loading member profile…</section>;
  if (error && !member) return <section className="member-profile-state error"><h1>Member unavailable</h1><p>{error}</p><Link href="/">Return home →</Link></section>;
  if (!member) return null;
  const displayName = member.profile.displayName || member.profile.username;
  const listedMembers = openList === "followers" ? member.followers : member.following;

  return <>
    <section className="public-profile-hero"><div className="container public-profile-heading"><ProfileAvatar className="public-profile-avatar" name={displayName} photoUrl={member.profile.avatarUrl}/><div><span className="kicker">MEMBER PROFILE</span><h1>{displayName}</h1><strong>@{member.profile.username}</strong><p>{member.profile.role} · Joined {shortDate(member.profile.joinedAt)}</p>{member.profile.bio ? <p className="public-profile-bio">{member.profile.bio}</p> : member.isOwnProfile ? <Link className="empty-profile-bio" href="/account/profile">Add a short biography →</Link> : null}</div><div className="public-profile-actions">{!member.isOwnProfile && <><button className={member.isFollowing ? "following" : ""} disabled={followBusy} onClick={() => void toggleFollow()}>{followBusy ? "Saving…" : member.isFollowing ? "✓ Following" : "+ Follow"}</button><Link href={`/messages?to=${encodeURIComponent(member.profile.username)}&visibility=private`}>Private message</Link><Link href={`/messages?to=${encodeURIComponent(member.profile.username)}&visibility=public`}>Public note</Link></>}{member.isOwnProfile && <Link href="/account/profile">Edit public profile →</Link>}</div></div></section>

    <section className="container member-network-layout"><aside className="member-network-card"><span className="kicker">RESEARCH NETWORK</span><button onClick={() => setOpenList(openList === "followers" ? null : "followers")}><strong>{member.followerCount}</strong><span>Followers</span></button><button onClick={() => setOpenList(openList === "following" ? null : "following")}><strong>{member.followingCount}</strong><span>Following</span></button><div className="member-research-activity"><strong>{member.researchActivity.approvedContributions}</strong><span>Approved contributions</span><strong>{member.researchActivity.companiesCovered}</strong><span>Companies covered</span><strong>{member.researchActivity.publishedCorrections}</strong><span>Published corrections</span></div>{member.researchActivity.expertise.length > 0 && <div className="member-expertise"><small>EXPERTISE FROM APPROVED RESEARCH</small><div>{member.researchActivity.expertise.map(topic => <span key={topic}>{topic}</span>)}</div></div>}<p>Following, approved research, and corrections are public so members can assess expertise through evidence—not popularity alone.</p>{openList && <div className="member-connection-list"><strong>{openList === "followers" ? "Followers" : "Following"}</strong>{listedMembers.length === 0 ? <p>No members yet.</p> : listedMembers.map(person => person.username && <Link key={person.username} href={`/members/${encodeURIComponent(person.username)}`}><span>{(person.display_name || person.username).slice(0,1).toUpperCase()}</span><div><strong>@{person.username}</strong>{person.display_name && <small>{person.display_name}</small>}</div></Link>)}</div>}</aside>

      <div className="public-profile-content"><section className="research-identity-card"><header><span className="kicker">RESEARCH IDENTITY</span><h2>How @{member.profile.username} approaches ownership</h2></header><div className="research-identity-grid"><div><small>INVESTMENT STYLE</small><p>{member.profile.investmentStyle || "Not specified"}</p></div><div><small>PRIMARY TIME HORIZON</small><p>{member.profile.timeHorizon || "Not specified"}</p></div></div>{member.profile.expertiseAreas.length > 0 && <div className="declared-expertise"><small>DECLARED SECTORS &amp; EXPERTISE</small><div>{member.profile.expertiseAreas.map(area => <span key={area}>{area}</span>)}</div></div>}{member.profile.credential && <div className="verified-credential"><span>✓ VERIFIED CREDENTIAL</span><strong>{member.profile.credential}</strong>{member.profile.credentialVerifiedAt && <small>Verified {shortDate(member.profile.credentialVerifiedAt)}</small>}</div>}{(member.profile.linkedinUrl || member.profile.websiteUrl) && <div className="professional-links"><small>APPROVED PROFESSIONAL LINKS</small>{member.profile.linkedinUrl && <a href={member.profile.linkedinUrl} target="_blank" rel="noreferrer">LinkedIn profile ↗</a>}{member.profile.websiteUrl && <a href={member.profile.websiteUrl} target="_blank" rel="noreferrer">Professional website ↗</a>}</div>}</section>
      <section className="correction-history"><header><div><span className="kicker">TRANSPARENT RECORD</span><h2>Published corrections</h2></div><strong>{member.researchActivity.publishedCorrections}</strong></header>{member.corrections.length ? member.corrections.map(correction => <article key={correction.id}><time>{shortDate(correction.createdAt)}</time><p>{correction.summary}</p>{correction.sourceUrl && <a href={correction.sourceUrl} target="_blank" rel="noreferrer">Supporting source ↗</a>}</article>) : <p>No published corrections. This count records formal corrections; it is not a prediction-accuracy score.</p>}</section>
      <div className="public-message-wall"><div className="public-wall-heading"><div><span className="kicker">PUBLIC MESSAGES</span><h2>Notes to @{member.profile.username}</h2></div>{!member.isOwnProfile && <Link href={`/messages?to=${encodeURIComponent(member.profile.username)}&visibility=public`}>Write a public note →</Link>}</div>{error && <p className="form-error">{error}</p>}{member.publicMessages.length === 0 ? <div className="public-wall-empty"><h3>No public notes yet.</h3><p>Public messages appear here with the sender&apos;s username. Private messages remain visible only to their participants.</p></div> : <div className="public-note-list">{member.publicMessages.map(message => <article key={message.id}><header><Link href={`/members/${encodeURIComponent(message.sender?.username ?? "member")}`}>@{message.sender?.username ?? "member"}</Link><time>{shortDate(message.createdAt)}</time></header><h3>{message.subject}</h3><p>{message.body}</p></article>)}</div>}</div></div>
    </section>
  </>;
}
