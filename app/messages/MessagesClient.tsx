"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { authenticatedFetch, loginPath } from "../supabase-browser";

type Member = { username: string; displayName: string };
type Message = {
  id: number;
  subject: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  direction: "sent" | "received";
  sender: Member;
  recipient: Member;
};

function messageDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

export function MessagesClient() {
  const [folder, setFolder] = useState<"inbox" | "sent">("inbox");
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [composing, setComposing] = useState(false);
  const [sending, setSending] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ username: string; display_name: string }>>([]);
  const [form, setForm] = useState({ recipientUsername: "", subject: "", body: "" });

  const selected = messages.find(message => message.id === selectedId) ?? null;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await authenticatedFetch(`/api/messages?folder=${folder}`, { cache: "no-store" });
      if (response.status === 401) return void (window.location.href = loginPath("/messages"));
      const data = await response.json() as { messages?: Message[]; unread?: number; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Unable to load messages.");
      setMessages(data.messages ?? []);
      setUnread(data.unread ?? 0);
      setSelectedId(current => (data.messages ?? []).some(message => message.id === current) ? current : null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load messages.");
    } finally {
      setLoading(false);
    }
  }, [folder]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const query = form.recipientUsername.trim();
    if (query.length < 2) return void setSuggestions([]);
    const timer = window.setTimeout(() => {
      authenticatedFetch(`/api/messages?recipients=${encodeURIComponent(query)}`)
        .then(async response => {
          const data = await response.json() as { recipients?: Array<{ username: string; display_name: string }> };
          if (response.ok) setSuggestions(data.recipients ?? []);
        }).catch(() => setSuggestions([]));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [form.recipientUsername]);

  async function openMessage(message: Message) {
    setSelectedId(message.id);
    setNotice("");
    if (message.direction === "received" && !message.readAt) {
      const response = await authenticatedFetch("/api/messages", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: message.id }) });
      if (response.ok) {
        setMessages(current => current.map(item => item.id === message.id ? { ...item, readAt: new Date().toISOString() } : item));
        setUnread(current => Math.max(0, current - 1));
      }
    }
  }

  function startCompose(recipientUsername = "", subject = "") {
    setForm({ recipientUsername, subject, body: "" });
    setSuggestions([]);
    setError("");
    setNotice("");
    setComposing(true);
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    setSending(true);
    setError("");
    setNotice("");
    try {
      const response = await authenticatedFetch("/api/messages", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Unable to send your message.");
      setComposing(false);
      setForm({ recipientUsername: "", subject: "", body: "" });
      setNotice("Message sent privately.");
      if (folder !== "sent") setFolder("sent"); else await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to send your message.");
    } finally {
      setSending(false);
    }
  }

  async function removeMessage() {
    if (!selected) return;
    const response = await authenticatedFetch("/api/messages", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: selected.id }) });
    const data = await response.json() as { error?: string };
    if (!response.ok) return setError(data.error ?? "Unable to remove this message.");
    setSelectedId(null);
    setNotice(folder === "sent" ? "Removed from Sent." : "Removed from your inbox.");
    await load();
  }

  return <section className="container messages-layout">
    <aside className="mail-folders">
      <button className="compose-button" onClick={() => startCompose()}>＋ New message</button>
      <button className={folder === "inbox" ? "active" : ""} onClick={() => { setFolder("inbox"); setSelectedId(null); setComposing(false); }}><span>Inbox</span>{unread > 0 && <em>{unread}</em>}</button>
      <button className={folder === "sent" ? "active" : ""} onClick={() => { setFolder("sent"); setSelectedId(null); setComposing(false); }}><span>Sent</span></button>
      <p>Messages are private to the two participating accounts. Email addresses remain hidden.</p>
    </aside>

    <div className="mailbox">
      <div className="mailbox-heading"><div><span className="kicker">{folder === "inbox" ? "INBOX" : "SENT MESSAGES"}</span><h2>{folder === "inbox" ? "Private correspondence" : "Notes you have sent"}</h2></div><strong>{messages.length} message{messages.length === 1 ? "" : "s"}</strong></div>
      {notice && <p className="message-notice">{notice}</p>}
      {error && <p className="form-error">{error}</p>}
      {loading ? <div className="mail-empty">Loading messages…</div> : messages.length === 0 ? <div className="mail-empty"><h3>{folder === "inbox" ? "Your inbox is clear." : "No sent messages yet."}</h3><p>Use a member&apos;s username to start a private research conversation.</p><button onClick={() => startCompose()}>Write a message →</button></div> : <div className="mail-list">{messages.map(message => {
        const correspondent = folder === "inbox" ? message.sender : message.recipient;
        return <button key={message.id} className={`${selectedId === message.id ? "selected" : ""} ${folder === "inbox" && !message.readAt ? "unread" : ""}`} onClick={() => void openMessage(message)}><span className="mail-avatar">{correspondent.username.slice(0, 1).toUpperCase()}</span><span className="mail-summary"><strong>@{correspondent.username}</strong><b>{message.subject}</b><small>{message.body}</small></span><time>{messageDate(message.createdAt)}</time>{folder === "inbox" && !message.readAt && <i aria-label="Unread" />}</button>;
      })}</div>}
    </div>

    <article className={`message-reader ${selected ? "open" : ""}`}>
      {selected ? <><button className="reader-back" onClick={() => setSelectedId(null)}>← Back to messages</button><span className="kicker">{selected.direction === "received" ? "FROM" : "TO"}</span><h2>{selected.subject}</h2><div className="message-party"><span className="mail-avatar">{(selected.direction === "received" ? selected.sender.username : selected.recipient.username).slice(0, 1).toUpperCase()}</span><div><strong>@{selected.direction === "received" ? selected.sender.username : selected.recipient.username}</strong><time>{messageDate(selected.createdAt)}</time></div></div><p className="message-body">{selected.body}</p><div className="message-actions">{selected.direction === "received" && <button onClick={() => startCompose(selected.sender.username, selected.subject.startsWith("Re:") ? selected.subject : `Re: ${selected.subject}`)}>Reply</button>}<button className="secondary" onClick={() => void removeMessage()}>Remove</button></div></> : <div className="reader-placeholder"><span>✉</span><h3>Select a message</h3><p>Open a private note to read it here.</p></div>}
    </article>

    {composing && <div className="compose-overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setComposing(false); }}><form className="compose-panel" onSubmit={send}><div className="compose-heading"><div><span className="kicker">NEW PRIVATE MESSAGE</span><h2>Write to a member</h2></div><button type="button" aria-label="Close compose window" onClick={() => setComposing(false)}>×</button></div><label>TO USERNAME<div className="recipient-field"><span>@</span><input required minLength={3} maxLength={24} pattern="[A-Za-z0-9_]+" autoComplete="off" value={form.recipientUsername} onChange={event => setForm({ ...form, recipientUsername: event.target.value.replace(/^@/, "") })} placeholder="owner_researcher" /></div>{suggestions.length > 0 && <div className="recipient-suggestions">{suggestions.map(member => <button type="button" key={member.username} onClick={() => { setForm({ ...form, recipientUsername: member.username }); setSuggestions([]); }}><strong>@{member.username}</strong>{member.display_name && <span>{member.display_name}</span>}</button>)}</div>}</label><label>SUBJECT<input required maxLength={120} value={form.subject} onChange={event => setForm({ ...form, subject: event.target.value })} placeholder="What would you like to discuss?" /></label><label>MESSAGE<textarea required maxLength={5000} value={form.body} onChange={event => setForm({ ...form, body: event.target.value })} placeholder="Share your private note…" /><small>{form.body.length.toLocaleString()} / 5,000</small></label>{error && <p className="form-error">{error}</p>}<div className="compose-actions"><button type="button" className="secondary" onClick={() => setComposing(false)}>Cancel</button><button disabled={sending}>{sending ? "Sending…" : "Send private message →"}</button></div></form></div>}
  </section>;
}
