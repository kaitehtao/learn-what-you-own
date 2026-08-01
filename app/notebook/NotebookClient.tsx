"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { authenticatedFetch, loginPath } from "../supabase-browser";

type Notebook = { id: number; ticker: string; companyName: string; thesis: string; conviction: string; createdAt: string; updatedAt: string };
type Note = { id: number; notebookId: number | null; noteType: string; title: string; body: string; status: string; tags: string[]; sourceTitle: string; sourceUrl: string; sourceExcerpt: string; sourceDate: string | null; pinned: boolean; createdAt: string; updatedAt: string };
type NotebookResponse = { notebooks: Notebook[]; notes: Note[]; owner: { username: string; displayName: string }; error?: string };

const noteTypes = [
  ["general", "Research note"], ["source", "Saved source"], ["thesis", "Thesis"], ["bull_case", "Bull case"],
  ["bear_case", "Bear case"], ["risk", "Risk"], ["catalyst", "Catalyst"], ["question", "Open question"], ["task", "Research task"],
];

function labelFor(type: string) {
  return noteTypes.find(([value]) => value === type)?.[1] ?? "Research note";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function noteDraft(note: Note) {
  return { ...note, tagsText: note.tags.join(", ") };
}

export function NotebookClient({ initialTicker }: { initialTicker?: string }) {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [owner, setOwner] = useState("researcher");
  const [selectedNotebookId, setSelectedNotebookId] = useState<number | "inbox" | "all">("all");
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [draft, setDraft] = useState<ReturnType<typeof noteDraft> | null>(null);
  const [draftDirty, setDraftDirty] = useState(false);
  const [thesisDraft, setThesisDraft] = useState("");
  const [thesisDirty, setThesisDirty] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [newTicker, setNewTicker] = useState(initialTicker ?? "");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saveState, setSaveState] = useState("Saved");
  const [error, setError] = useState("");

  const selectedNotebook = typeof selectedNotebookId === "number" ? notebooks.find((item) => item.id === selectedNotebookId) ?? null : null;

  const load = useCallback(async () => {
    const response = await authenticatedFetch("/api/notebook");
    if (response.status === 401) return void (window.location.href = loginPath(`/notebook${initialTicker ? `?ticker=${encodeURIComponent(initialTicker)}` : ""}`));
    const data = await response.json() as NotebookResponse;
    if (!response.ok) throw new Error(data.error ?? "Unable to load your research notebook.");
    setNotebooks(data.notebooks);
    setNotes(data.notes);
    setOwner(data.owner.username);
    if (initialTicker) {
      const existing = data.notebooks.find((item) => item.ticker === initialTicker);
      if (existing) setSelectedNotebookId(existing.id);
      else {
        const createdResponse = await authenticatedFetch("/api/notebook", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "create_notebook", ticker: initialTicker }) });
        const created = await createdResponse.json() as { notebook?: Notebook; error?: string };
        if (!createdResponse.ok || !created.notebook) throw new Error(created.error ?? "Unable to create the company notebook.");
        setNotebooks((current) => [...current, created.notebook!].sort((a, b) => a.ticker.localeCompare(b.ticker)));
        setSelectedNotebookId(created.notebook.id);
      }
    }
  }, [initialTicker]);

  useEffect(() => {
    let active = true;
    load().catch((caught) => active && setError(caught instanceof Error ? caught.message : "Unable to load your notebook.")).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [load]);

  useEffect(() => {
    const selected = notes.find((item) => item.id === selectedNoteId);
    setDraft(selected ? noteDraft(selected) : null);
    setDraftDirty(false);
  }, [selectedNoteId, notes]);

  useEffect(() => {
    setThesisDraft(selectedNotebook?.thesis ?? "");
    setThesisDirty(false);
  }, [selectedNotebook?.id, selectedNotebook?.thesis]);

  useEffect(() => {
    if (!draft || !draftDirty) return;
    setSaveState("Saving…");
    const timer = window.setTimeout(async () => {
      const response = await authenticatedFetch("/api/notebook", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({
        entity: "note", id: draft.id, noteType: draft.noteType, title: draft.title || "Untitled research note", body: draft.body,
        status: draft.status, tags: draft.tagsText.split(",").map((tag) => tag.trim()).filter(Boolean), sourceTitle: draft.sourceTitle,
        sourceUrl: draft.sourceUrl, sourceExcerpt: draft.sourceExcerpt, sourceDate: draft.sourceDate, pinned: draft.pinned,
      }) });
      const data = await response.json() as { note?: Note; error?: string };
      if (!response.ok || !data.note) { setError(data.error ?? "Autosave failed."); setSaveState("Not saved"); return; }
      setNotes((current) => current.map((item) => item.id === data.note!.id ? data.note! : item));
      setDraftDirty(false);
      setSaveState("Saved");
    }, 850);
    return () => window.clearTimeout(timer);
  }, [draft, draftDirty]);

  useEffect(() => {
    if (!selectedNotebook || !thesisDirty) return;
    setSaveState("Saving…");
    const timer = window.setTimeout(async () => {
      const response = await authenticatedFetch("/api/notebook", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ entity: "notebook", id: selectedNotebook.id, thesis: thesisDraft }) });
      const data = await response.json() as { notebook?: Notebook; error?: string };
      if (!response.ok || !data.notebook) { setError(data.error ?? "Thesis autosave failed."); setSaveState("Not saved"); return; }
      setNotebooks((current) => current.map((item) => item.id === data.notebook!.id ? data.notebook! : item));
      setThesisDirty(false);
      setSaveState("Saved");
    }, 850);
    return () => window.clearTimeout(timer);
  }, [selectedNotebook, thesisDraft, thesisDirty]);

  const visibleNotes = useMemo(() => notes.filter((note) => {
    if (selectedNotebookId === "inbox" && note.notebookId !== null) return false;
    if (typeof selectedNotebookId === "number" && note.notebookId !== selectedNotebookId) return false;
    if (typeFilter !== "all" && note.noteType !== typeFilter) return false;
    const haystack = `${note.title} ${note.body} ${note.sourceTitle} ${note.tags.join(" ")}`.toLowerCase();
    return haystack.includes(search.trim().toLowerCase());
  }), [notes, search, selectedNotebookId, typeFilter]);

  async function createNotebook(event: React.FormEvent) {
    event.preventDefault();
    if (!newTicker.trim()) return;
    setBusy(true); setError("");
    const response = await authenticatedFetch("/api/notebook", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "create_notebook", ticker: newTicker }) });
    const data = await response.json() as { notebook?: Notebook; error?: string };
    setBusy(false);
    if (!response.ok || !data.notebook) return setError(data.error ?? "Unable to create that notebook.");
    setNotebooks((current) => [...current.filter((item) => item.id !== data.notebook!.id), data.notebook!].sort((a, b) => a.ticker.localeCompare(b.ticker)));
    setSelectedNotebookId(data.notebook.id); setNewTicker(""); setSelectedNoteId(null);
  }

  async function createNote(type = "general") {
    setBusy(true); setError("");
    const response = await authenticatedFetch("/api/notebook", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
      action: "create_note", notebookId: typeof selectedNotebookId === "number" ? selectedNotebookId : null, noteType: type,
      title: type === "task" ? "New research task" : type === "question" ? "New open question" : "Untitled research note",
    }) });
    const data = await response.json() as { note?: Note; error?: string };
    setBusy(false);
    if (!response.ok || !data.note) return setError(data.error ?? "Unable to create a note.");
    setNotes((current) => [data.note!, ...current]); setSelectedNoteId(data.note.id);
  }

  async function updateConviction(conviction: string) {
    if (!selectedNotebook) return;
    const response = await authenticatedFetch("/api/notebook", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ entity: "notebook", id: selectedNotebook.id, conviction }) });
    const data = await response.json() as { notebook?: Notebook; error?: string };
    if (!response.ok || !data.notebook) return setError(data.error ?? "Unable to update conviction.");
    setNotebooks((current) => current.map((item) => item.id === data.notebook!.id ? data.notebook! : item));
  }

  async function deleteNote() {
    if (!draft || !window.confirm("Delete this private note? This cannot be undone.")) return;
    const response = await authenticatedFetch("/api/notebook", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ entity: "note", id: draft.id }) });
    if (!response.ok) return setError("Unable to delete this note.");
    setNotes((current) => current.filter((item) => item.id !== draft.id)); setSelectedNoteId(null);
  }

  const publishHref = draft && selectedNotebook ? `/contribute?${new URLSearchParams({ ticker: selectedNotebook.ticker, type: "Thesis update", claim: draft.title.slice(0, 1000), why: (draft.body || draft.sourceExcerpt).slice(0, 1200), source: draft.sourceUrl }).toString()}` : "/contribute";
  const completedTasks = notes.filter((note) => note.noteType === "task" && note.status === "done").length;

  if (loading) return <section className="notebook-loading">Opening your private research workspace…</section>;
  if (error && !notebooks.length && !notes.length) return <section className="notebook-loading"><strong>Notebook unavailable</strong><p>{error}</p></section>;

  return <>
    <section className="notebook-hero"><div className="container"><div><span className="kicker">PRIVATE INVESTMENT RESEARCH</span><h1>Your working memory,<br />organized by company.</h1><p>Capture primary sources, pressure-test a thesis, track unanswered questions, and publish only the insight you deliberately choose.</p></div><div className="notebook-privacy"><span>PRIVATE BY DEFAULT</span><strong>@{owner}</strong><p>Only you can read these notebooks. Public contributions use a separate review workflow.</p></div></div></section>
    <section className="container notebook-stats"><div><small>COMPANY NOTEBOOKS</small><strong>{notebooks.length}</strong></div><div><small>PRIVATE NOTES</small><strong>{notes.length}</strong></div><div><small>OPEN QUESTIONS</small><strong>{notes.filter((note) => note.noteType === "question" && note.status === "active").length}</strong></div><div><small>TASKS COMPLETED</small><strong>{completedTasks}</strong></div></section>
    {error && <div className="container notebook-error">{error}<button onClick={() => setError("")}>×</button></div>}
    <section className="container notebook-workspace">
      <aside className="notebook-sidebar">
        <div className="notebook-sidebar-heading"><span>RESEARCH LIBRARY</span><button onClick={() => createNote("general")} disabled={busy}>＋ Note</button></div>
        <button className={selectedNotebookId === "all" ? "active" : ""} onClick={() => { setSelectedNotebookId("all"); setSelectedNoteId(null); }}><span>⌕</span><div><strong>All research</strong><small>{notes.length} notes</small></div></button>
        <button className={selectedNotebookId === "inbox" ? "active" : ""} onClick={() => { setSelectedNotebookId("inbox"); setSelectedNoteId(null); }}><span>↓</span><div><strong>Research inbox</strong><small>{notes.filter((note) => note.notebookId === null).length} uncategorized</small></div></button>
        <div className="notebook-company-label">COMPANY NOTEBOOKS</div>
        <div className="notebook-company-list">{notebooks.map((book) => <button key={book.id} className={selectedNotebookId === book.id ? "active" : ""} onClick={() => { setSelectedNotebookId(book.id); setSelectedNoteId(null); }}><span>{book.ticker.slice(0, 4)}</span><div><strong>{book.ticker}</strong><small>{notes.filter((note) => note.notebookId === book.id).length} notes · {book.conviction}</small></div></button>)}</div>
        <form className="new-notebook-form" onSubmit={createNotebook}><label>NEW COMPANY NOTEBOOK<input value={newTicker} onChange={(event) => setNewTicker(event.target.value.toUpperCase())} maxLength={12} placeholder="Ticker, e.g. NVDA" /></label><button disabled={busy || !newTicker.trim()}>{busy ? "Adding…" : "Add company →"}</button></form>
      </aside>

      <div className="notebook-index">
        <header>{selectedNotebook ? <div className="notebook-company-header"><Link href={`/company/${selectedNotebook.ticker.toLowerCase()}`}>{selectedNotebook.ticker}</Link><div><small>PRIVATE COMPANY NOTEBOOK</small><h2>{selectedNotebook.companyName}</h2></div><label>CONVICTION<select value={selectedNotebook.conviction} onChange={(event) => updateConviction(event.target.value)}><option value="unranked">Unranked</option><option value="watching">Watching</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label></div> : <div><span className="kicker">{selectedNotebookId === "inbox" ? "RESEARCH INBOX" : "COMPLETE LIBRARY"}</span><h2>{selectedNotebookId === "inbox" ? "Ideas waiting to be filed" : "All private research"}</h2></div>}</header>
        {selectedNotebook && <label className="notebook-thesis"><span>ONE-SENTENCE WORKING THESIS <em>{thesisDirty ? saveState : "Autosaved"}</em></span><textarea value={thesisDraft} onChange={(event) => { setThesisDraft(event.target.value); setThesisDirty(true); }} placeholder={`What must be true for ${selectedNotebook.ticker} to become a good long-term investment?`} /></label>}
        <div className="notebook-tools"><label>⌕<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search notes, sources, and tags" /></label><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="all">All note types</option>{noteTypes.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><button onClick={() => createNote("general")} disabled={busy}>New note ＋</button></div>
        <div className="notebook-quick-add"><span>QUICK ADD</span>{[["source", "Source"], ["risk", "Risk"], ["catalyst", "Catalyst"], ["question", "Question"], ["task", "Task"]].map(([type, label]) => <button key={type} onClick={() => createNote(type)} disabled={busy}>＋ {label}</button>)}</div>
        <div className="notebook-note-list">{visibleNotes.length ? visibleNotes.map((note) => <button key={note.id} className={`${selectedNoteId === note.id ? "selected" : ""} ${note.status === "done" ? "done" : ""}`} onClick={() => setSelectedNoteId(note.id)}><span className={`note-type-icon ${note.noteType}`}>{note.pinned ? "★" : labelFor(note.noteType).slice(0, 1)}</span><div><header><small>{labelFor(note.noteType)}{note.status === "done" ? " · DONE" : ""}</small><time>{formatDate(note.updatedAt)}</time></header><strong>{note.title}</strong><p>{note.body || note.sourceExcerpt || note.sourceTitle || "Start writing…"}</p>{note.tags.length > 0 && <footer>{note.tags.slice(0, 4).map((tag) => <em key={tag}>#{tag}</em>)}</footer>}</div></button>) : <div className="notebook-empty"><span>✎</span><h3>No research here yet.</h3><p>Start with a question, save a source from a company dossier, or write down the claim you want to test.</p><button onClick={() => createNote("general")}>Create the first note →</button></div>}</div>
      </div>

      <aside className={`notebook-editor ${draft ? "open" : ""}`}>{draft ? <>
        <header><button className="notebook-editor-back" onClick={() => setSelectedNoteId(null)}>← Notes</button><span>{saveState}</span><button onClick={deleteNote} aria-label="Delete note">Delete</button></header>
        <div className="notebook-editor-fields"><div className="notebook-editor-meta"><label>TYPE<select value={draft.noteType} onChange={(event) => { setDraft({ ...draft, noteType: event.target.value }); setDraftDirty(true); }}>{noteTypes.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>STATUS<select value={draft.status} onChange={(event) => { setDraft({ ...draft, status: event.target.value }); setDraftDirty(true); }}><option value="active">Active</option><option value="done">Done</option><option value="archived">Archived</option></select></label><button className={draft.pinned ? "pinned" : ""} onClick={() => { setDraft({ ...draft, pinned: !draft.pinned }); setDraftDirty(true); }}>{draft.pinned ? "★ Pinned" : "☆ Pin"}</button></div>
          <input className="notebook-note-title" value={draft.title} onChange={(event) => { setDraft({ ...draft, title: event.target.value }); setDraftDirty(true); }} placeholder="Note title" />
          <textarea className="notebook-note-body" value={draft.body} onChange={(event) => { setDraft({ ...draft, body: event.target.value }); setDraftDirty(true); }} placeholder="Write what you know, what you infer, and what still needs verification…" />
          <label className="notebook-field">TAGS<input value={draft.tagsText} onChange={(event) => { setDraft({ ...draft, tagsText: event.target.value }); setDraftDirty(true); }} placeholder="moat, margins, management" /></label>
          <div className="notebook-source-fields"><div><span>SOURCE &amp; CITATION</span><small>Keep the evidence beside the interpretation.</small></div><label>SOURCE TITLE<input value={draft.sourceTitle} onChange={(event) => { setDraft({ ...draft, sourceTitle: event.target.value }); setDraftDirty(true); }} placeholder="10-K, earnings call, investor presentation…" /></label><label>SOURCE URL<input type="url" value={draft.sourceUrl} onChange={(event) => { setDraft({ ...draft, sourceUrl: event.target.value }); setDraftDirty(true); }} placeholder="https://www.sec.gov/…" /></label><label>DATE<input type="date" value={draft.sourceDate ?? ""} onChange={(event) => { setDraft({ ...draft, sourceDate: event.target.value }); setDraftDirty(true); }} /></label><label>IMPORTANT EXCERPT<textarea value={draft.sourceExcerpt} onChange={(event) => { setDraft({ ...draft, sourceExcerpt: event.target.value }); setDraftDirty(true); }} placeholder="Paste the exact passage or summarize the evidence you need to revisit." /></label>{draft.sourceUrl && <a href={draft.sourceUrl} target="_blank" rel="noreferrer">Open original source ↗</a>}</div>
        </div>
        <footer className="notebook-publish"><div><strong>Ready to share an insight?</strong><p>Only this note moves to the public editorial form. Your notebook stays private.</p></div>{selectedNotebook ? <Link href={publishHref}>Prepare public contribution →</Link> : <span>File this note under a company first.</span>}</footer>
      </> : <div className="notebook-editor-placeholder"><span>PRIVATE WORKSPACE</span><h3>Select a note to begin.</h3><p>Your sources, excerpts, questions, and unfinished ideas remain visible only to you.</p></div>}</aside>
    </section>
  </>;
}
