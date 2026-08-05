"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { authenticatedFetch, loginPath } from "../../supabase-browser";

type Citation = { title: string; url: string; excerpt: string; date: string };
type Publication = { id: number; authorUsername: string; sourceNoteId: number | null; title: string; summary: string; body: string; bullCase: string; bearCase: string; risks: string; catalysts: string; valuation: string; tickers: string[]; citations: Citation[]; positionDisclosure: string; conflictDisclosure: string; visibility: string; status: string; editorialStatus: string; revisionNumber: number; publishedAt: string | null; createdAt: string; updatedAt: string; bookmarked: boolean };
type Comment = { id: number; author_username: string; body: string; created_at: string };
type Revision = { revision_number: number; change_summary: string; created_at: string };
type Draft = { title: string; summary: string; body: string; bullCase: string; bearCase: string; risks: string; catalysts: string; valuation: string; tickers: string; citationTitle: string; citationUrl: string; citationExcerpt: string; positionDisclosure: string; conflictDisclosure: string; visibility: string; selectedUsernames: string };

const emptyDraft: Draft = { title: "", summary: "", body: "", bullCase: "", bearCase: "", risks: "", catalysts: "", valuation: "", tickers: "", citationTitle: "", citationUrl: "", citationExcerpt: "", positionDisclosure: "", conflictDisclosure: "", visibility: "public", selectedUsernames: "" };
function date(value: string | null) { return value ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value)) : "Draft"; }

export function ResearchCommunityClient({ initialId, initialTicker, initialAuthor, sourceNoteId, composeInitially }: { initialId: string; initialTicker: string; initialAuthor: string; sourceNoteId: string; composeInitially: boolean }) {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [selected, setSelected] = useState<Publication | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [viewer, setViewer] = useState<{ username: string } | null>(null);
  const [feed, setFeed] = useState("all");
  const [ticker, setTicker] = useState(initialTicker.toUpperCase());
  const [author, setAuthor] = useState(initialAuthor);
  const [compose, setCompose] = useState(composeInitially || Boolean(sourceNoteId));
  const [preview, setPreview] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (initialId) params.set("id", initialId);
    if (!initialId && ticker) params.set("ticker", ticker);
    if (!initialId && author) params.set("author", author);
    if (!initialId && feed !== "all") params.set("feed", feed);
    return params.toString();
  }, [initialId, ticker, author, feed]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch(`/api/publications${query ? `?${query}` : ""}`, { cache: "no-store" });
      const data = await response.json() as { publications?: Publication[]; publication?: Publication; comments?: Comment[]; revisions?: Revision[]; viewer?: { username: string } | null; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Unable to load community research.");
      setViewer(data.viewer ?? null);
      setPublications(data.publications ?? []);
      setSelected(data.publication ?? null);
      setComments(data.comments ?? []);
      setRevisions(data.revisions ?? []);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to load community research."); }
    finally { setLoading(false); }
  }, [query]);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  useEffect(() => {
    if (!sourceNoteId) return;
    authenticatedFetch("/api/notebook").then(async response => {
      if (!response.ok) return;
      const data = await response.json() as { notes?: Array<{ id: number; title: string; body: string; sourceTitle: string; sourceUrl: string; sourceExcerpt: string; notebookId: number | null }>; notebooks?: Array<{ id: number; ticker: string }> };
      const note = data.notes?.find(item => String(item.id) === sourceNoteId);
      const book = data.notebooks?.find(item => item.id === note?.notebookId);
      if (note) setDraft(current => ({ ...current, title: note.title, body: note.body || note.sourceExcerpt, tickers: book?.ticker ?? "", citationTitle: note.sourceTitle || note.title, citationUrl: note.sourceUrl, citationExcerpt: note.sourceExcerpt }));
    }).catch(() => undefined);
  }, [sourceNoteId]);

  function setField(key: keyof Draft, value: string) { setDraft(current => ({ ...current, [key]: value })); }
  function payload() {
    return { sourceNoteId: Number(sourceNoteId) || null, title: draft.title, summary: draft.summary, body: draft.body, bullCase: draft.bullCase, bearCase: draft.bearCase, risks: draft.risks, catalysts: draft.catalysts, valuation: draft.valuation, tickers: draft.tickers.split(/[,\s]+/).filter(Boolean), citations: draft.citationTitle || draft.citationUrl || draft.citationExcerpt ? [{ title: draft.citationTitle, url: draft.citationUrl, excerpt: draft.citationExcerpt }] : [], positionDisclosure: draft.positionDisclosure, conflictDisclosure: draft.conflictDisclosure, visibility: draft.visibility, selectedUsernames: draft.selectedUsernames.split(/[,\s]+/).filter(Boolean), submitForReview: true };
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!viewer) return void window.location.assign(loginPath(`/research/community?compose=1${sourceNoteId ? `&sourceNote=${sourceNoteId}` : ""}`));
    setBusy(true); setMessage("");
    try {
      const response = await authenticatedFetch("/api/publications", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload()) });
      const data = await response.json() as { publication?: Publication; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Unable to submit research.");
      setMessage("Submitted for editorial review. Your private notebook note was not changed."); setCompose(false); setDraft(emptyDraft); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to submit research."); }
    finally { setBusy(false); }
  }
  async function bookmark(publication: Publication) {
    if (!viewer) return void window.location.assign(loginPath(`/research/community?id=${publication.id}`));
    const response = await authenticatedFetch("/api/publications", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "bookmark", publicationId: publication.id, bookmarked: !publication.bookmarked }) });
    if (response.ok) { const bookmarked = !publication.bookmarked; setSelected(current => current?.id === publication.id ? { ...current, bookmarked } : current); setPublications(items => items.map(item => item.id === publication.id ? { ...item, bookmarked } : item)); }
  }
  async function postComment(event: React.FormEvent) {
    event.preventDefault(); if (!selected || !comment.trim()) return;
    if (!viewer) return void window.location.assign(loginPath(`/research/community?id=${selected.id}`));
    const response = await authenticatedFetch("/api/publications", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "comment", publicationId: selected.id, body: comment }) });
    const data = await response.json() as { comment?: Comment; error?: string };
    if (!response.ok) return setMessage(data.error ?? "Unable to comment.");
    if (data.comment) setComments(items => [...items, data.comment!]); setComment("");
  }
  async function withdraw() {
    if (!selected || !window.confirm("Withdraw this publication? It will disappear from public and follower feeds.")) return;
    const response = await authenticatedFetch("/api/publications", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: selected.id, action: "withdraw" }) });
    if (response.ok) { setMessage("Publication withdrawn."); await load(); }
  }

  return <>
    <section className="community-research-hero"><div className="container"><span className="kicker">COMMUNITY RESEARCH</span><h1>Publish analysis, not noise.</h1><p>Long-form, source-linked research with position disclosures, editorial review, revision history, and ticker-level discovery.</p><div><button onClick={() => setCompose(true)}>Write research</button><Link href="/community-guidelines">Read community standards →</Link></div></div></section>
    <section className="container community-research-shell">
      {message && <p className="community-status">{message}</p>}
      {selected ? <article className="research-publication-detail"><Link href="/research/community">← Community research</Link><header><div>{selected.tickers.map(item => <Link key={item} href={`/research/community?ticker=${item}`}>${item}</Link>)}</div><h1>{selected.title}</h1><p>{selected.summary}</p><small>By <Link href={`/research/community?author=${selected.authorUsername}`}>@{selected.authorUsername}</Link> · {date(selected.publishedAt || selected.updatedAt)} · Revision {selected.revisionNumber}</small><div><button onClick={() => void bookmark(selected)}>{selected.bookmarked ? "★ Saved" : "☆ Save"}</button>{viewer?.username === selected.authorUsername && <button onClick={() => void withdraw()}>Withdraw</button>}</div></header><section><h2>Research</h2><p>{selected.body}</p></section>{selected.bullCase && <section><h2>Bull case</h2><p>{selected.bullCase}</p></section>}{selected.bearCase && <section><h2>Bear case</h2><p>{selected.bearCase}</p></section>}{selected.risks && <section><h2>Risks</h2><p>{selected.risks}</p></section>}{selected.catalysts && <section><h2>Catalysts</h2><p>{selected.catalysts}</p></section>}{selected.valuation && <section><h2>Valuation</h2><p>{selected.valuation}</p></section>}<section><h2>Sources</h2>{selected.citations.length ? selected.citations.map((source, index) => <article className="publication-citation" key={`${source.url}-${index}`}><strong>{index + 1}. {source.title || "Source"}</strong><p>{source.excerpt}</p>{source.url && <a href={source.url} target="_blank" rel="noreferrer">Open cited source ↗</a>}</article>) : <p>No citations were attached.</p>}</section><aside className="publication-disclosures"><strong>Position disclosure</strong><p>{selected.positionDisclosure || "No position disclosed."}</p><strong>Conflict disclosure</strong><p>{selected.conflictDisclosure || "No conflict disclosed."}</p></aside><section><h2>Revision history</h2>{revisions.length ? revisions.map(item => <p key={item.revision_number}>Revision {item.revision_number} · {date(item.created_at)} {item.change_summary && `— ${item.change_summary}`}</p>) : <p>Original publication.</p>}</section><section><h2>Discussion</h2>{comments.map(item => <article className="publication-comment" key={item.id}><strong>@{item.author_username}</strong><time>{date(item.created_at)}</time><p>{item.body}</p></article>)}<form onSubmit={postComment}><textarea value={comment} onChange={event => setComment(event.target.value)} placeholder="Add an evidence-led comment" maxLength={3000}/><button>Post comment</button></form></section></article> : <>
        <div className="community-feed-controls"><div>{["all", "following", "bookmarks", "mine"].map(item => <button className={feed === item ? "active" : ""} onClick={() => setFeed(item)} key={item}>{item}</button>)}</div><label>Ticker<input value={ticker} onChange={event => setTicker(event.target.value.toUpperCase())} placeholder="e.g. AMD" /></label><label>Author<input value={author} onChange={event => setAuthor(event.target.value)} placeholder="username" /></label></div>
        {compose && <form className="research-composer" onSubmit={submit}><header><div><span className="kicker">LONG-FORM RESEARCH</span><h2>{preview ? "Publication preview" : "Prepare an editorial draft"}</h2></div><div><button type="button" onClick={() => setPreview(!preview)}>{preview ? "Edit" : "Preview"}</button><button type="button" onClick={() => setCompose(false)}>Close</button></div></header>{preview ? <article className="composer-preview"><h1>{draft.title || "Untitled research"}</h1><p>{draft.summary}</p><h2>Research</h2><p>{draft.body}</p><h2>Bull case</h2><p>{draft.bullCase}</p><h2>Bear case</h2><p>{draft.bearCase}</p><small>Visibility: {draft.visibility}. Editorial approval is required before publication.</small></article> : <div className="research-composer-grid"><label>Title<input value={draft.title} onChange={event => setField("title", event.target.value)} required minLength={3}/></label><label>Tickers<input value={draft.tickers} onChange={event => setField("tickers", event.target.value.toUpperCase())} placeholder="AMD, NVDA" /></label><label className="wide">Executive summary<textarea value={draft.summary} onChange={event => setField("summary", event.target.value)} /></label><label className="wide">Full research<textarea className="long" value={draft.body} onChange={event => setField("body", event.target.value)} /></label><label>Bull case<textarea value={draft.bullCase} onChange={event => setField("bullCase", event.target.value)} /></label><label>Bear case<textarea value={draft.bearCase} onChange={event => setField("bearCase", event.target.value)} /></label><label>Risks<textarea value={draft.risks} onChange={event => setField("risks", event.target.value)} /></label><label>Catalysts<textarea value={draft.catalysts} onChange={event => setField("catalysts", event.target.value)} /></label><label className="wide">Valuation<textarea value={draft.valuation} onChange={event => setField("valuation", event.target.value)} /></label><label>Source title<input value={draft.citationTitle} onChange={event => setField("citationTitle", event.target.value)} /></label><label>Source URL<input value={draft.citationUrl} onChange={event => setField("citationUrl", event.target.value)} /></label><label className="wide">Relevant source excerpt<textarea value={draft.citationExcerpt} onChange={event => setField("citationExcerpt", event.target.value)} /></label><label>Position disclosure<textarea value={draft.positionDisclosure} onChange={event => setField("positionDisclosure", event.target.value)} /></label><label>Conflict disclosure<textarea value={draft.conflictDisclosure} onChange={event => setField("conflictDisclosure", event.target.value)} /></label><label>Who can read after approval<select value={draft.visibility} onChange={event => setField("visibility", event.target.value)}><option value="public">Public</option><option value="followers">Followers</option><option value="selected">Selected members</option><option value="private">Private draft</option></select></label>{draft.visibility === "selected" && <label>Selected usernames<input value={draft.selectedUsernames} onChange={event => setField("selectedUsernames", event.target.value)} placeholder="alice, bob" /></label>}</div>}<footer><p>Your notebook source remains private and unchanged. Editors must approve this draft before it can appear publicly or notify followers.</p><button disabled={busy}>{busy ? "Submitting…" : "Submit for editorial review"}</button></footer></form>}
        {loading ? <div className="community-feed-empty">Loading research…</div> : publications.length ? <div className="community-publication-grid">{publications.map(item => <article key={item.id}><header><div>{item.tickers.map(value => <Link href={`/research/community?ticker=${value}`} key={value}>${value}</Link>)}</div><button onClick={() => void bookmark(item)}>{item.bookmarked ? "★" : "☆"}</button></header><h2><Link href={`/research/community?id=${item.id}`}>{item.title}</Link></h2><p>{item.summary || item.body}</p><footer><Link href={`/research/community?author=${item.authorUsername}`}>@{item.authorUsername}</Link><span>{date(item.publishedAt || item.updatedAt)}</span><em>{item.editorialStatus}</em></footer></article>)}</div> : <div className="community-feed-empty"><h2>No research matches these filters.</h2><p>Start a source-linked draft or broaden the ticker and author filters.</p></div>}
      </>}
    </section>
  </>;
}
