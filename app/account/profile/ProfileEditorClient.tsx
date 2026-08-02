"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ProfileAvatar } from "../../ProfileAvatar";
import { authenticatedFetch, loginPath } from "../../supabase-browser";

type ReviewStatus = "unreviewed" | "pending" | "approved" | "verified" | "rejected";
type PublicProfileFields = {
  username: string;
  display_name: string;
  bio: string;
  avatar_url?: string | null;
  onboarding_complete: boolean;
  investment_style: string;
  time_horizon: string;
  expertise_areas: string;
  linkedin_url: string | null;
  website_url: string | null;
  links_status: ReviewStatus;
  credential_summary: string;
  credential_status: ReviewStatus;
};
type AccountResponse = { profile: PublicProfileFields; error?: string };
type ProfileForm = { displayName: string; bio: string; investmentStyle: string; timeHorizon: string; expertiseAreas: string; linkedinUrl: string; websiteUrl: string; credentialSummary: string };

const blankForm: ProfileForm = { displayName: "", bio: "", investmentStyle: "", timeHorizon: "", expertiseAreas: "", linkedinUrl: "", websiteUrl: "", credentialSummary: "" };

function formFromProfile(profile: PublicProfileFields): ProfileForm {
  return {
    displayName: profile.display_name ?? "",
    bio: profile.bio ?? "",
    investmentStyle: profile.investment_style ?? "",
    timeHorizon: profile.time_horizon ?? "",
    expertiseAreas: profile.expertise_areas ?? "",
    linkedinUrl: profile.linkedin_url ?? "",
    websiteUrl: profile.website_url ?? "",
    credentialSummary: profile.credential_summary ?? "",
  };
}

export function ProfileEditorClient() {
  const [account, setAccount] = useState<AccountResponse | null>(null);
  const [form, setForm] = useState<ProfileForm>(blankForm);
  const [photo, setPhoto] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const previewUrl = useMemo(() => photo ? URL.createObjectURL(photo) : null, [photo]);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);
  useEffect(() => {
    authenticatedFetch("/api/account", { cache: "no-store" }).then(async response => {
      if (response.status === 401) return void (window.location.href = loginPath("/account/profile"));
      const data = await response.json() as AccountResponse;
      if (!response.ok) return setError(data.error ?? "Unable to load your profile.");
      if (!data.profile.onboarding_complete) return void (window.location.href = "/onboarding");
      setAccount(data); setForm(formFromProfile(data.profile));
    }).catch(caught => setError(caught instanceof Error ? caught.message : "Unable to load your profile."));
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!account) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const profileResponse = await authenticatedFetch("/api/account", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: account.profile.username, ...form }),
      });
      const profileData = await profileResponse.json() as AccountResponse;
      if (!profileResponse.ok) throw new Error(profileData.error ?? "Unable to update your public profile.");

      let avatarUrl = account.profile.avatar_url ?? null;
      if (photo) {
        const upload = new FormData(); upload.set("photo", photo);
        const photoResponse = await authenticatedFetch("/api/account/photo", { method: "POST", body: upload });
        const photoData = await photoResponse.json() as { avatarUrl?: string; error?: string };
        if (!photoResponse.ok) throw new Error(photoData.error ?? "Unable to upload your photo.");
        avatarUrl = photoData.avatarUrl ?? avatarUrl;
      }
      const updated = { ...account, profile: { ...account.profile, ...profileData.profile, avatar_url: avatarUrl } };
      setAccount(updated); setForm(formFromProfile(updated.profile)); setPhoto(null);
      setNotice("Your public profile has been updated. New credentials and professional links are submitted for administrator review.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to update your profile."); }
    finally { setBusy(false); }
  }

  async function removePhoto() {
    if (!account?.profile.avatar_url || busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await authenticatedFetch("/api/account/photo", { method: "DELETE" });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Unable to remove your photo.");
      setAccount({ ...account, profile: { ...account.profile, avatar_url: null } });
      setPhoto(null); setNotice("Your profile photo has been removed.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to remove your photo."); }
    finally { setBusy(false); }
  }

  if (error && !account) return <section className="profile-editor-state"><p className="form-error">{error}</p></section>;
  if (!account) return <section className="profile-editor-state">Loading your public profile…</section>;
  const name = form.displayName || account.profile.username;

  return <section className="profile-editor-shell">
    <div className="container profile-editor-heading"><div><span className="kicker">PUBLIC PROFILE</span><h1>Introduce the researcher behind the username.</h1><p>Your public profile can show your biography, investing approach, expertise, approved professional links, verified credentials, and research record. Your email, phone, portfolio, watchlist, and notebook stay private.</p></div><Link href={`/members/${encodeURIComponent(account.profile.username)}`}>Preview public profile →</Link></div>
    <form className="container profile-editor-form" onSubmit={save}>
      <aside className="profile-photo-editor"><ProfileAvatar className="profile-photo-preview" name={name} photoUrl={previewUrl ?? account.profile.avatar_url}/><label className="photo-picker">CHOOSE PHOTO<input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => setPhoto(event.target.files?.[0] ?? null)}/></label><small>JPG, PNG, or WebP. Maximum 3 MB. A square photo works best.</small>{account.profile.avatar_url && <button type="button" className="remove-profile-photo" disabled={busy} onClick={() => void removePhoto()}>Remove current photo</button>}</aside>
      <div className="profile-copy-editor">
        <label>DISPLAY NAME<input maxLength={80} value={form.displayName} onChange={event => setForm({ ...form, displayName: event.target.value })} placeholder="Your public name"/></label>
        <label>SHORT BIOGRAPHY<textarea maxLength={500} value={form.bio} onChange={event => setForm({ ...form, bio: event.target.value })} placeholder="Share your investing perspective, professional background, and the industries you understand best."/><small>{form.bio.length} / 500 characters</small></label>
        <div className="profile-editor-grid"><label>INVESTMENT STYLE<input maxLength={160} value={form.investmentStyle} onChange={event => setForm({ ...form, investmentStyle: event.target.value })} placeholder="Long-term quality, special situations…"/></label><label>PRIMARY TIME HORIZON<select value={form.timeHorizon} onChange={event => setForm({ ...form, timeHorizon: event.target.value })}><option value="">Not specified</option><option>Under 1 year</option><option>1–3 years</option><option>3–5 years</option><option>5–10 years</option><option>10+ years</option></select></label></div>
        <label>SECTORS &amp; EXPERTISE<input maxLength={240} value={form.expertiseAreas} onChange={event => setForm({ ...form, expertiseAreas: event.target.value })} placeholder="Semiconductors, cloud infrastructure, accounting"/><small>Separate areas with commas.</small></label>
        <div className="profile-editor-grid"><label>LINKEDIN PROFILE<input type="url" maxLength={300} value={form.linkedinUrl} onChange={event => setForm({ ...form, linkedinUrl: event.target.value })} placeholder="https://www.linkedin.com/in/your-profile"/></label><label>PROFESSIONAL WEBSITE<input type="url" maxLength={300} value={form.websiteUrl} onChange={event => setForm({ ...form, websiteUrl: event.target.value })} placeholder="https://yourwebsite.com"/></label></div>
        <label>CREDENTIALS FOR VERIFICATION<textarea maxLength={240} value={form.credentialSummary} onChange={event => setForm({ ...form, credentialSummary: event.target.value })} placeholder="Example: CFA charterholder; former semiconductor engineer; CPA"/><small>{form.credentialSummary.length} / 240 characters</small></label>
        <div className="profile-review-status"><span><strong>Professional links</strong><em className={account.profile.links_status}>{account.profile.links_status}</em></span><span><strong>Credentials</strong><em className={account.profile.credential_status}>{account.profile.credential_status}</em></span><p>Links and credentials appear publicly only after administrator review. Editing either item restarts review.</p></div>
        <div className="profile-guidance"><strong>Trust is attached to evidence.</strong><p>Position and conflict disclosures remain attached to individual research contributions. Approved contributions and published corrections appear automatically on your public record.</p></div>
        {error && <p className="form-error">{error}</p>}{notice && <p className="form-success">{notice}</p>}
        <button className="save-public-profile" disabled={busy}>{busy ? "Saving…" : "Save public profile →"}</button>
      </div>
    </form>
  </section>;
}
