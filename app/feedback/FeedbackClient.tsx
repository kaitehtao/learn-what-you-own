"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { authenticatedFetch, loginPath } from "../supabase-browser";

const categories = [
  { value: "New feature", label: "Feature request" },
  { value: "Product improvement", label: "Product improvement" },
  { value: "Research coverage", label: "Research coverage" },
  { value: "Bug report", label: "Bug report" },
  { value: "Accessibility", label: "Accessibility" },
  { value: "Other", label: "Other" },
] as const;
type CategoryValue = (typeof categories)[number]["value"];
type FeedbackItem = { id: number; category: string; title: string; details: string; status: string; moderatorNote: string; createdAt: string };
type RankedFeatureRequest = { id: number; username: string; title: string; details: string; status: string; createdAt: string; voteCount: number; viewerHasVoted: boolean };

export function FeedbackClient() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [ranked, setRanked] = useState<RankedFeatureRequest[]>([]);
  const [form, setForm] = useState<{ category: CategoryValue; title: string; details: string }>({ category: categories[0].value, title: "", details: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    const [rankedResponse, privateResponse] = await Promise.all([
      authenticatedFetch("/api/feedback?view=ranked", { cache: "no-store" }),
      authenticatedFetch("/api/feedback", { cache: "no-store" }),
    ]);
    if (rankedResponse.ok) {
      const payload = await rankedResponse.json() as { featureRequests: RankedFeatureRequest[] };
      setRanked(payload.featureRequests ?? []);
    }
    if (privateResponse.status === 401) { setSignedIn(false); return; }
    if (!privateResponse.ok) { setSignedIn(true); setError("Unable to load your feedback history."); return; }
    const payload = await privateResponse.json() as { feedback: FeedbackItem[] };
    setItems(payload.feedback ?? []); setSignedIn(true);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load().catch(() => setSignedIn(false)), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError(""); setNotice("");
    const response = await authenticatedFetch("/api/feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    const payload = await response.json() as { error?: string };
    if (response.status === 401) { window.location.href = loginPath("/feedback"); return; }
    if (!response.ok) { setError(payload.error ?? "Unable to submit feedback."); setBusy(false); return; }
    setForm({ category: categories[0].value, title: "", details: "" });
    setNotice("Thank you. @Yourhost will review your feedback before assigning a product status.");
    await load();
    setBusy(false);
  }

  async function vote(item: RankedFeatureRequest) {
    if (signedIn !== true) { window.location.assign(loginPath("/feedback")); return; }
    setError("");
    const response = await authenticatedFetch("/api/feedback/vote", {
      method: item.viewerHasVoted ? "DELETE" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ feedbackId: item.id }),
    });
    if (response.status === 401) { window.location.assign(loginPath("/feedback")); return; }
    if (!response.ok) { setError("Unable to update your ranking vote."); return; }
    await load();
  }

  return (
    <section className="container feedback-layout">
      <aside>
        <span className="kicker">WHAT HAPPENS NEXT</span>
        <ol>
          <li><strong>Submitted</strong><span>Your request is recorded privately.</span></li>
          <li><strong>Reviewing</strong><span>@Yourhost evaluates the problem, evidence, and impact.</span></li>
          <li><strong>Planned</strong><span>Approved work is placed into the product roadmap.</span></li>
          <li><strong>Completed</strong><span>The improvement is released and marked finished.</span></li>
        </ol>
        <p>Feedback is not published as investment research and does not bypass the separate research-moderation process.</p>
      </aside>
      <article>
        <section className="feature-ranking">
          <div className="form-heading"><span>Ranked feature requests</span><em>One vote per verified member</em></div>
          <p>Requests appear here after moderator review. Vote for the improvements that would make LearnWhatYouOwn more useful; the list is ranked by member support.</p>
          {ranked.length === 0 ? <div className="feature-ranking-empty"><strong>No approved feature requests yet.</strong><span>Submit the first idea below. @Yourhost will review it before it appears publicly.</span></div> : <div className="feature-ranking-list">{ranked.map((item, index) => <article key={item.id}>
            <span className="feature-rank">#{index + 1}</span>
            <div><small>Requested by @{item.username}</small><h3>{item.title}</h3><p>{item.details}</p><em className={`feedback-status status-${item.status}`}>{item.status}</em></div>
            <button type="button" className={item.viewerHasVoted ? "voted" : ""} aria-pressed={item.viewerHasVoted} onClick={() => void vote(item)}><strong>{item.voteCount}</strong><span>{item.viewerHasVoted ? "Voted" : "Vote"}</span></button>
          </article>)}</div>}
        </section>
        {signedIn === null && <div className="feedback-state">Checking your account…</div>}
        {signedIn === false && <div className="feedback-signup">
          <span className="kicker">VERIFIED MEMBERS</span>
          <h2>Turn an idea into a tracked request.</h2>
          <p>Anyone can read our public research. A free account lets you submit product feedback, follow its status, vote on research priorities, and use a private owner workspace.</p>
          <div className="feedback-benefits"><span>Private watchlists</span><span>Portfolio context</span><span>Research notebooks</span><span>Moderated contributions</span><span>Product feedback history</span><span>Member alerts</span></div>
          <div className="feedback-signup-actions"><Link className="button dark-button" href="/login?mode=signup&returnTo=%2Ffeedback">Create a free account</Link><Link href="/login?returnTo=%2Ffeedback">Already a member? Sign in</Link></div>
          <small>No phone number or private investment information is displayed publicly.</small>
        </div>}
        {signedIn === true && <>
          <form className="feedback-form" onSubmit={submit}>
            <div className="form-heading"><span>New product feedback</span><em>Reviewed by @Yourhost</em></div>
            <label>CATEGORY<select value={form.category} onChange={event => setForm({ ...form, category: event.target.value as typeof form.category })}>{categories.map(category => <option value={category.value} key={category.value}>{category.label}</option>)}</select></label>
            <label>SHORT TITLE<input required minLength={8} maxLength={120} value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} placeholder="What should be easier or possible?" /></label>
            <label>DETAILS<textarea required minLength={30} maxLength={4000} value={form.details} onChange={event => setForm({ ...form, details: event.target.value })} placeholder="Describe the user problem, the improvement you want, and why it would help owners." /></label>
            {error && <p className="form-error">{error}</p>}
            {notice && <p className="auth-notice">{notice}</p>}
            <button className="submit-contribution" disabled={busy}>{busy ? "Submitting…" : "Submit product feedback →"}</button>
          </form>
          <div className="feedback-history">
            <div className="form-heading"><span>My feedback history</span><em>{items.length} requests</em></div>
            {items.length === 0 ? <p>No product feedback submitted yet.</p> : items.map(item => <div className="feedback-row" key={item.id}><span><small>{item.category}</small><strong>{item.title}</strong><p>{item.details}</p>{item.moderatorNote && <em>@Yourhost note: {item.moderatorNote}</em>}</span><b className={`feedback-status status-${item.status}`}>{item.status}</b></div>)}
          </div>
        </>}
      </article>
    </section>
  );
}
