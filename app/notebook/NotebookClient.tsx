"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { authenticatedFetch, loginPath } from "../supabase-browser";

type Notebook = { id: number; ticker: string | null; companyKind: "public" | "private"; companyKey: string; companyName: string; thesis: string; conviction: string; createdAt: string; updatedAt: string };
type Note = { id: number; notebookId: number | null; noteType: string; title: string; body: string; status: string; tags: string[]; sourceTitle: string; sourceUrl: string; sourceExcerpt: string; sourceDate: string | null; pinned: boolean; createdAt: string; updatedAt: string };
type Attachment = { id: number; notebookId: number; fileName: string; mimeType: string; fileSize: number; createdAt: string };
type NotebookResponse = { notebooks: Notebook[]; notes: Note[]; attachments: Attachment[]; owner: { username: string; displayName: string }; error?: string };

const noteTypes = [
  ["general", "Research note"], ["source", "Saved source"], ["thesis", "Thesis"], ["bull_case", "Bull case"],
  ["bear_case", "Bear case"], ["risk", "Risk"], ["catalyst", "Catalyst"], ["question", "Open question"], ["task", "Research task"],
  ["observation", "Observation"], ["operating_metric", "Operating metric"], ["customer", "Customer insight"],
  ["team", "Team"], ["market", "Market"], ["competition", "Competition"], ["funding", "Funding"], ["cap_table", "Cap table"],
];

function labelFor(type: string) {
  return noteTypes.find(([value]) => value === type)?.[1] ?? "Research note";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function formatBytes(value: number) {
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function noteDraft(note: Note) {
  return { ...note, tagsText: note.tags.join(", ") };
}

export function NotebookClient({ initialTicker, initialNotebookId }: { initialTicker?: string; initialNotebookId?: number }) {
  const router = useRouter();
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
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
  const [newCompanyKind, setNewCompanyKind] = useState<"public" | "private">("public");
  const [newPrivateCompany, setNewPrivateCompany] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saveState, setSaveState] = useState("Saved");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadInputKey, setUploadInputKey] = useState(0);

  const selectedNotebook = typeof selectedNotebookId === "number" ? notebooks.find((item) => item.id === selectedNotebookId) ?? null : null;

  function selectNotebook(id: number | "inbox" | "all") {
    const notebook = typeof id === "number" ? notebooks.find((item) => item.id === id) ?? null : null;
    setSelectedNotebookId(id);
    setSelectedNoteId(null);
    setDraft(null);
    setDraftDirty(false);
    setThesisDraft(notebook?.thesis ?? "");
    setThesisDirty(false);
    setSaveState("Saved");
  }

  function selectNote(note: Note | null) {
    setSelectedNoteId(note?.id ?? null);
    setDraft(note ? noteDraft(note) : null);
    setDraftDirty(false);
    setSaveState("Saved");
  }

  function editDraft(patch: Partial<ReturnType<typeof noteDraft>>) {
    setDraft((current) => current ? { ...current, ...patch } : current);
    setDraftDirty(true);
    setSaveState("Saving…");
  }

  function editThesis(value: string) {
    setThesisDraft(value);
    setThesisDirty(true);
    setSaveState("Saving…");
  }

  const load = useCallback(async () => {
    const response = await authenticatedFetch("/api/notebook");
    const returnQuery = initialTicker ? `?ticker=${encodeURIComponent(initialTicker)}` : initialNotebookId ? `?notebookId=${initialNotebookId}` : "";
    if (response.status === 401) return void (window.location.href = loginPath(`/notebook${returnQuery}`));
    const data = await response.json() as NotebookResponse;
    if (!response.ok) throw new Error(data.error ?? "Unable to load your research notebook.");
    setNotebooks(data.notebooks);
    setNotes(data.notes);
    setAttachments(data.attachments ?? []);
    setOwner(data.owner.username);
    if (initialNotebookId) {
      const existing = data.notebooks.find((item) => item.id === initialNotebookId);
      if (existing) {
        setSelectedNotebookId(existing.id);
        setThesisDraft(existing.thesis);
      }
    } else if (initialTicker) {
      const existing = data.notebooks.find((item) => item.ticker === initialTicker);
      if (existing) {
        setSelectedNotebookId(existing.id);
        setThesisDraft(existing.thesis);
      }
      else {
        const createdResponse = await authenticatedFetch("/api/notebook", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "create_notebook", ticker: initialTicker }) });
        const created = await createdResponse.json() as { notebook?: Notebook; error?: string };
        if (!createdResponse.ok || !created.notebook) throw new Error(created.error ?? "Unable to create the company notebook.");
        setNotebooks((current) => [...current, created.notebook!].sort((a, b) => a.companyName.localeCompare(b.companyName)));
        setSelectedNotebookId(created.notebook.id);
        setThesisDraft(created.notebook.thesis);
      }
    }
  }, [initialNotebookId, initialTicker]);

  useEffect(() => {
    let active = true;
    const initialLoad = window.setTimeout(() => {
      void load()
        .catch((caught) => active && setError(caught instanceof Error ? caught.message : "Unable to load your notebook."))
        .finally(() => active && setLoading(false));
    }, 0);
    return () => { active = false; window.clearTimeout(initialLoad); };
  }, [load]);

  useEffect(() => {
    if (!draft || !draftDirty) return;
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
    if (newCompanyKind === "public" ? !newTicker.trim() : !newPrivateCompany.trim()) return;
    setBusy(true); setError("");
    const response = await authenticatedFetch("/api/notebook", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(newCompanyKind === "private"
      ? { action: "create_private_notebook", companyName: newPrivateCompany }
      : { action: "create_notebook", ticker: newTicker }) });
    const data = await response.json() as { notebook?: Notebook; error?: string };
    setBusy(false);
    if (!response.ok || !data.notebook) return setError(data.error ?? "Unable to create that notebook.");
    setNotebooks((current) => [...current.filter((item) => item.id !== data.notebook!.id), data.notebook!].sort((a, b) => a.companyName.localeCompare(b.companyName)));
    setSelectedNotebookId(data.notebook.id); setNewTicker(""); setNewPrivateCompany(""); setSelectedNoteId(null); setDraft(null); setThesisDraft(data.notebook.thesis); setThesisDirty(false);
    if (data.notebook.companyKind === "private") router.push(`/notebook/private-company/${data.notebook.id}`);
  }

  async function createNote(type = "general") {
    setBusy(true); setError("");
    const response = await authenticatedFetch("/api/notebook", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
      action: "create_note", notebookId: typeof selectedNotebookId === "number" ? selectedNotebookId : null, noteType: type,
      title: type === "task" ? "New research task" : type === "question" ? "New open question" : type === "source" ? "Private research link" : "Untitled research note",
    }) });
    const data = await response.json() as { note?: Note; error?: string };
    setBusy(false);
    if (!response.ok || !data.note) return setError(data.error ?? "Unable to create a note.");
    setNotes((current) => [data.note!, ...current]); selectNote(data.note);
  }

  async function uploadPdf(file: File | null) {
    if (!file || !selectedNotebook) return;
    setUploading(true); setError("");
    const form = new FormData();
    form.set("notebookId", String(selectedNotebook.id));
    form.set("file", file);
    const response = await authenticatedFetch("/api/notebook/attachments", { method: "POST", body: form });
    const data = await response.json() as { attachment?: Attachment; error?: string };
    setUploading(false); setUploadInputKey((value) => value + 1);
    if (!response.ok || !data.attachment) return setError(data.error ?? "Unable to upload that PDF.");
    setAttachments((current) => [data.attachment!, ...current]);
  }

  async function openAttachment(attachment: Attachment) {
    const response = await authenticatedFetch(`/api/notebook/attachments/${attachment.id}`, { cache: "no-store" });
    const data = await response.json() as { url?: string; error?: string };
    if (!response.ok || !data.url) return setError(data.error ?? "Unable to open that PDF.");
    window.open(data.url, "_blank", "noopener,noreferrer");
  }

  async function deleteAttachment(attachment: Attachment) {
    if (!window.confirm(`Delete ${attachment.fileName} from this private notebook?`)) return;
    const response = await authenticatedFetch("/api/notebook/attachments", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: attachment.id }) });
    const data = await response.json() as { error?: string };
    if (!response.ok) return setError(data.error ?? "Unable to delete that PDF.");
    setAttachments((current) => current.filter((item) => item.id !== attachment.id));
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
    setNotes((current) => current.filter((item) => item.id !== draft.id)); selectNote(null);
  }

  const publishHref = draft ? `/research/community?compose=1&sourceNote=${draft.id}` : "/research/community?compose=1";
  const completedTasks = notes.filter((note) => note.noteType === "task" && note.status === "done").length;
  const selectedAttachments = selectedNotebook ? attachments.filter((attachment) => attachment.notebookId === selectedNotebook.id) : [];
  const quickAddTypes = selectedNotebook?.companyKind === "private"
    ? [["observation", "Observation"], ["operating_metric", "KPI note"], ["customer", "Customer"], ["team", "Team"], ["market", "Market"], ["competition", "Competition"], ["risk", "Risk"], ["question", "Question"]]
    : [["source", "Source"], ["risk", "Risk"], ["catalyst", "Catalyst"], ["question", "Question"], ["task", "Task"]];

  if (loading) return <section className="notebook-loading">Opening your private research workspace…</section>;
  if (error && !notebooks.length && !notes.length) return <section className="notebook-loading"><strong>Notebook unavailable</strong><p>{error}</p></section>;

  return <>
    <section className="notebook-hero"><div className="container"><div><span className="kicker">PRIVATE INVESTMENT RESEARCH</span><h1>Your working memory,<br />organized by company.</h1><p>Capture primary sources, pressure-test a thesis, track unanswered questions, and publish only the insight you deliberately choose.</p></div><div className="notebook-privacy"><span>PRIVATE BY DEFAULT</span><strong>@{owner}</strong><p>Only you can read these notebooks. Public contributions use a separate review workflow.</p></div></div></section>
    <section className="container notebook-stats"><div><small>COMPANY NOTEBOOKS</small><strong>{notebooks.length}</strong></div><div><small>PRIVATE MATERIALS</small><strong>{notes.length + attachments.length}</strong></div><div><small>PDF ATTACHMENTS</small><strong>{attachments.length}</strong></div><div><small>TASKS COMPLETED</small><strong>{completedTasks}</strong></div></section>
    {error && <div className="container notebook-error">{error}<button onClick={() => setError("")}>×</button></div>}
    <section className="container notebook-workspace">
      <aside className="notebook-sidebar">
        <div className="notebook-sidebar-heading"><span>RESEARCH LIBRARY</span><button onClick={() => createNote("general")} disabled={busy}>＋ Note</button></div>
        <button className={selectedNotebookId === "all" ? "active" : ""} onClick={() => selectNotebook("all")}><span>⌕</span><div><strong>All research</strong><small>{notes.length} notes</small></div></button>
        <button className={selectedNotebookId === "inbox" ? "active" : ""} onClick={() => selectNotebook("inbox")}><span>↓</span><div><strong>Research inbox</strong><small>{notes.filter((note) => note.notebookId === null).length} uncategorized</small></div></button>
        <div className="notebook-company-label">COMPANY NOTEBOOKS</div>
        <div className="notebook-company-list">{notebooks.map((book) => <button key={book.id} className={selectedNotebookId === book.id ? "active" : ""} onClick={() => book.companyKind === "private" ? router.push(`/notebook/private-company/${book.id}`) : selectNotebook(book.id)}><span>{book.companyKind === "private" ? book.companyName.slice(0, 2).toUpperCase() : book.ticker?.slice(0, 4)}</span><div><strong>{book.companyKind === "private" ? book.companyName : book.ticker}</strong><small>{book.companyKind === "private" ? "Private company · " : ""}{notes.filter((note) => note.notebookId === book.id).length} notes · {book.conviction}</small></div></button>)}</div>
        <form className="new-notebook-form" onSubmit={createNotebook}><div className="new-notebook-kind"><button type="button" className={newCompanyKind === "public" ? "active" : ""} onClick={() => setNewCompanyKind("public")}>Public ticker</button><button type="button" className={newCompanyKind === "private" ? "active" : ""} onClick={() => setNewCompanyKind("private")}>Private company</button></div>{newCompanyKind === "public" ? <label>NEW PUBLIC NOTEBOOK<input value={newTicker} onChange={(event) => setNewTicker(event.target.value.toUpperCase())} maxLength={12} placeholder="Ticker, e.g. NVDA" /></label> : <label>NEW PRIVATE COMPANY<input value={newPrivateCompany} onChange={(event) => setNewPrivateCompany(event.target.value)} maxLength={160} placeholder="Company name" /></label>}<button disabled={busy || (newCompanyKind === "public" ? !newTicker.trim() : !newPrivateCompany.trim())}>{busy ? "Adding…" : newCompanyKind === "private" ? "Build private profile →" : "Add company →"}</button></form>
      </aside>

      <div className="notebook-index">
        <header>{selectedNotebook ? <div className="notebook-company-header">{selectedNotebook.companyKind === "public" && selectedNotebook.ticker ? <Link href={`/company/${selectedNotebook.ticker.toLowerCase()}`}>{selectedNotebook.ticker}</Link> : <Link href={`/notebook/private-company/${selectedNotebook.id}`}>{selectedNotebook.companyName.slice(0, 2).toUpperCase()}</Link>}<div><small>{selectedNotebook.companyKind === "private" ? "PRIVATE MARKET NOTEBOOK" : "PRIVATE COMPANY NOTEBOOK"}</small><h2>{selectedNotebook.companyName}</h2></div><label>CONVICTION<select value={selectedNotebook.conviction} onChange={(event) => updateConviction(event.target.value)}><option value="unranked">Unranked</option><option value="watching">Watching</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label></div> : <div><span className="kicker">{selectedNotebookId === "inbox" ? "RESEARCH INBOX" : "COMPLETE LIBRARY"}</span><h2>{selectedNotebookId === "inbox" ? "Ideas waiting to be filed" : "All private research"}</h2></div>}</header>
        {selectedNotebook && <label className="notebook-thesis"><span>ONE-SENTENCE WORKING THESIS <em>{thesisDirty ? saveState : "Autosaved"}</em></span><textarea value={thesisDraft} onChange={(event) => editThesis(event.target.value)} placeholder={`What must be true for ${selectedNotebook.ticker ?? selectedNotebook.companyName} to become a good long-term investment?`} /></label>}
        {selectedNotebook && <section className="notebook-private-materials"><header><div><small>PRIVATE FILES &amp; LINKS</small><strong>Evidence for {selectedNotebook.ticker ?? selectedNotebook.companyName}</strong></div><div>{selectedNotebook.companyKind === "private" && <Link href={`/notebook/private-company/${selectedNotebook.id}`}>Open profile</Link>}<button type="button" onClick={() => createNote("source")} disabled={busy}>＋ Private link</button><label className={uploading ? "uploading" : ""}>{uploading ? "Uploading…" : "＋ Upload PDF"}<input key={uploadInputKey} type="file" accept="application/pdf,.pdf" disabled={uploading} onChange={(event) => void uploadPdf(event.target.files?.[0] ?? null)} /></label></div></header><p>PDFs and links stay visible only inside your account. PDF limit: 20 MB.</p>{selectedAttachments.length > 0 && <div className="notebook-attachment-list">{selectedAttachments.map((attachment) => <article key={attachment.id}><button type="button" onClick={() => void openAttachment(attachment)}><span>PDF</span><div><strong>{attachment.fileName}</strong><small>{formatBytes(attachment.fileSize)} · Added {formatDate(attachment.createdAt)}</small></div></button><button type="button" aria-label={`Delete ${attachment.fileName}`} onClick={() => void deleteAttachment(attachment)}>×</button></article>)}</div>}</section>}
        <div className="notebook-tools"><label>⌕<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search notes, sources, and tags" /></label><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="all">All note types</option>{noteTypes.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><button onClick={() => createNote("general")} disabled={busy}>New note ＋</button></div>
        <div className="notebook-quick-add"><span>QUICK ADD</span>{quickAddTypes.map(([type, label]) => <button key={type} onClick={() => createNote(type)} disabled={busy}>＋ {label}</button>)}</div>
        <div className="notebook-note-list">{visibleNotes.length ? visibleNotes.map((note) => <button key={note.id} className={`${selectedNoteId === note.id ? "selected" : ""} ${note.status === "done" ? "done" : ""}`} onClick={() => selectNote(note)}><span className={`note-type-icon ${note.noteType}`}>{note.pinned ? "★" : labelFor(note.noteType).slice(0, 1)}</span><div><header><small>{labelFor(note.noteType)}{note.status === "done" ? " · DONE" : ""}</small><time>{formatDate(note.updatedAt)}</time></header><strong>{note.title}</strong><p>{note.body || note.sourceExcerpt || note.sourceTitle || "Start writing…"}</p>{note.tags.length > 0 && <footer>{note.tags.slice(0, 4).map((tag) => <em key={tag}>#{tag}</em>)}</footer>}</div></button>) : <div className="notebook-empty"><span>✎</span><h3>No research here yet.</h3><p>Start with a question, save a source from a company dossier, or write down the claim you want to test.</p><button onClick={() => createNote("general")}>Create the first note →</button></div>}</div>
      </div>

      <aside className={`notebook-editor ${draft ? "open" : ""}`}>{draft ? <>
        <header><button className="notebook-editor-back" onClick={() => selectNote(null)}>← Notes</button><span>{saveState}</span><button onClick={deleteNote} aria-label="Delete note">Delete</button></header>
        <div className="notebook-editor-fields"><div className="notebook-editor-meta"><label>TYPE<select value={draft.noteType} onChange={(event) => editDraft({ noteType: event.target.value })}>{noteTypes.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>STATUS<select value={draft.status} onChange={(event) => editDraft({ status: event.target.value })}><option value="active">Active</option><option value="done">Done</option><option value="archived">Archived</option></select></label><button className={draft.pinned ? "pinned" : ""} onClick={() => editDraft({ pinned: !draft.pinned })}>{draft.pinned ? "★ Pinned" : "☆ Pin"}</button></div>
          <input className="notebook-note-title" value={draft.title} onChange={(event) => editDraft({ title: event.target.value })} placeholder="Note title" />
          <textarea className="notebook-note-body" value={draft.body} onChange={(event) => editDraft({ body: event.target.value })} placeholder="Write what you know, what you infer, and what still needs verification…" />
          <label className="notebook-field">TAGS<input value={draft.tagsText} onChange={(event) => editDraft({ tagsText: event.target.value })} placeholder="moat, margins, management" /></label>
          <div className="notebook-source-fields"><div><span>SOURCE &amp; CITATION</span><small>Keep the evidence beside the interpretation.</small></div><label>SOURCE TITLE<input value={draft.sourceTitle} onChange={(event) => editDraft({ sourceTitle: event.target.value })} placeholder="10-K, earnings call, investor presentation…" /></label><label>SOURCE URL<input type="url" value={draft.sourceUrl} onChange={(event) => editDraft({ sourceUrl: event.target.value })} placeholder="https://www.sec.gov/…" /></label><label>DATE<input type="date" value={draft.sourceDate ?? ""} onChange={(event) => editDraft({ sourceDate: event.target.value })} /></label><label>IMPORTANT EXCERPT<textarea value={draft.sourceExcerpt} onChange={(event) => editDraft({ sourceExcerpt: event.target.value })} placeholder="Paste the exact passage or summarize the evidence you need to revisit." /></label>{draft.sourceUrl && <a href={draft.sourceUrl} target="_blank" rel="noreferrer">Open original source ↗</a>}</div>
        </div>
        <footer className="notebook-publish"><div><strong>Ready to publish long-form research?</strong><p>A copy opens as an editorial draft. The original private note remains unchanged.</p></div><Link href={publishHref}>Prepare public contribution →</Link></footer>
      </> : <div className="notebook-editor-placeholder"><span>PRIVATE WORKSPACE</span><h3>Select a note to begin.</h3><p>Your sources, excerpts, questions, and unfinished ideas remain visible only to you.</p></div>}</aside>
    </section>
  </>;
}
