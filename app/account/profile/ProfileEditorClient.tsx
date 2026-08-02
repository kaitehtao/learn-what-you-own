"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ProfileAvatar } from "../../ProfileAvatar";
import { authenticatedFetch, loginPath } from "../../supabase-browser";

type AccountResponse = {
  profile: {
    username: string;
    display_name: string;
    bio: string;
    avatar_url?: string | null;
    onboarding_complete: boolean;
  };
  error?: string;
};

export function ProfileEditorClient() {
  const [account, setAccount] = useState<AccountResponse | null>(null);
  const [form, setForm] = useState({ displayName: "", bio: "" });
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
      setAccount(data);
      setForm({ displayName: data.profile.display_name ?? "", bio: data.profile.bio ?? "" });
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
        body: JSON.stringify({ username: account.profile.username, displayName: form.displayName, bio: form.bio }),
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
      setAccount({ ...account, profile: { ...account.profile, display_name: form.displayName, bio: form.bio, avatar_url: avatarUrl } });
      setPhoto(null);
      setNotice("Your public profile has been updated.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update your profile.");
    } finally { setBusy(false); }
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
    <div className="container profile-editor-heading"><div><span className="kicker">PUBLIC PROFILE</span><h1>Introduce the researcher behind the username.</h1><p>Your photo, name, biography, role, and public research activity can be seen by anyone. Your email, phone, portfolio, watchlist, and notebook stay private.</p></div><Link href={`/members/${encodeURIComponent(account.profile.username)}`}>Preview public profile →</Link></div>
    <form className="container profile-editor-form" onSubmit={save}>
      <aside className="profile-photo-editor">
        <ProfileAvatar className="profile-photo-preview" name={name} photoUrl={previewUrl ?? account.profile.avatar_url} />
        <label className="photo-picker">CHOOSE PHOTO<input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => setPhoto(event.target.files?.[0] ?? null)}/></label>
        <small>JPG, PNG, or WebP. Maximum 3 MB. A square photo works best.</small>
        {account.profile.avatar_url && <button type="button" className="remove-profile-photo" disabled={busy} onClick={() => void removePhoto()}>Remove current photo</button>}
      </aside>
      <div className="profile-copy-editor">
        <label>DISPLAY NAME<input maxLength={80} value={form.displayName} onChange={event => setForm({ ...form, displayName: event.target.value })} placeholder="Your public name"/></label>
        <label>SHORT BIOGRAPHY<textarea maxLength={500} value={form.bio} onChange={event => setForm({ ...form, bio: event.target.value })} placeholder="Share your investing perspective, professional background, and the industries you understand best."/><small>{form.bio.length} / 500 characters</small></label>
        <div className="profile-guidance"><strong>What makes a useful profile?</strong><ul><li>Your sectors or operating experience</li><li>Your research style and time horizon</li><li>Relevant credentials without private contact details</li></ul><p>Position and conflict disclosures remain attached to individual research contributions, where readers can evaluate them in context.</p></div>
        {error && <p className="form-error">{error}</p>}{notice && <p className="form-success">{notice}</p>}
        <button className="save-public-profile" disabled={busy}>{busy ? "Saving…" : "Save public profile →"}</button>
      </div>
    </form>
  </section>;
}
