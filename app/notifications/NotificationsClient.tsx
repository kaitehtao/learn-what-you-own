"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { authenticatedFetch, loginPath } from "../supabase-browser";

type Notification = { id: number; kind: string; entityType: string; title: string; detail: string; href: string; readAt: string | null; createdAt: string };
type Preferences = { emailFrequency: string; emailMessagePreview: boolean };

function date(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function notificationLabel(kind: string, entityType: string) {
  if (entityType === "earnings_alert") return "EARNINGS ALERT";
  return kind === "public_message" ? "PUBLIC MESSAGE" : "PRIVATE MESSAGE";
}

export function NotificationsClient() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [preferences, setPreferences] = useState<Preferences>({ emailFrequency: "off", emailMessagePreview: false });
  const [emailAvailable, setEmailAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const response = await authenticatedFetch("/api/notifications", { cache: "no-store" });
    if (response.status === 401) return void (window.location.href = loginPath("/notifications"));
    const data = await response.json() as { notifications?: Notification[]; unread?: number; preferences?: Preferences; emailAvailable?: boolean; error?: string };
    if (!response.ok) throw new Error(data.error ?? "Unable to load notifications.");
    setNotifications(data.notifications ?? []); setUnread(data.unread ?? 0); setPreferences((current) => data.preferences ?? current); setEmailAvailable(Boolean(data.emailAvailable));
  }, []);

  useEffect(() => {
    let active = true;
    const initialLoad = window.setTimeout(() => {
      void load()
        .catch((caught) => active && setError(caught instanceof Error ? caught.message : "Unable to load notifications."))
        .finally(() => active && setLoading(false));
    }, 0);
    return () => { active = false; window.clearTimeout(initialLoad); };
  }, [load]);

  async function markAllRead() {
    await authenticatedFetch("/api/notifications", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "read_all" }) });
    setNotifications((current) => current.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() }))); setUnread(0); window.dispatchEvent(new Event("lwy:notifications-changed"));
  }

  async function open(notification: Notification) {
    if (!notification.readAt) await authenticatedFetch("/api/notifications", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "read", id: notification.id }) });
    window.dispatchEvent(new Event("lwy:notifications-changed"));
  }

  async function savePreferences() {
    setSaving(true); setError(""); setNotice("");
    const response = await authenticatedFetch("/api/notifications", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "preferences", ...preferences }) });
    const data = await response.json() as { preferences?: Preferences; error?: string };
    setSaving(false);
    if (!response.ok) return setError(data.error ?? "Unable to update notification settings.");
    if (data.preferences) setPreferences(data.preferences);
    setNotice("Notification preferences saved.");
  }

  return <section className="container notifications-layout"><article><header className="notifications-heading"><div><span className="kicker">IN-APP NOTIFICATIONS</span><h2>Your activity</h2></div>{unread > 0 && <button onClick={() => void markAllRead()}>Mark all as read</button>}</header>{loading ? <div className="notifications-empty">Loading notifications…</div> : error && !notifications.length ? <div className="notifications-empty">{error}</div> : notifications.length ? <div className="notification-center-list">{notifications.map((notification) => <Link className={notification.readAt ? "" : "unread"} href={notification.href} key={notification.id} onClick={() => void open(notification)}><i>{notification.entityType === "earnings_alert" ? "◷" : notification.kind === "public_message" ? "◎" : "✉"}</i><div><small>{notificationLabel(notification.kind, notification.entityType)}</small><strong>{notification.title}</strong><p>{notification.detail}</p><time>{date(notification.createdAt)}</time></div>{!notification.readAt && <em>NEW</em>}<span>→</span></Link>)}</div> : <div className="notifications-empty"><span>✓</span><h3>You’re all caught up.</h3><p>Earnings warnings, private messages, and public messages will appear here and in the notification bell.</p><Link href="/watchlist">Open your watchlist →</Link></div>}</article><aside className="notification-settings"><span className="kicker">EMAIL DELIVERY</span><h2>Choose when email should interrupt you.</h2><p>In-app alerts are always available. Email is opt-in and includes earnings warnings without exposing private message bodies.</p>{!emailAvailable && <div className="email-provider-notice"><strong>Email delivery is awaiting provider connection.</strong><p>The notification center is live now. Email choices will unlock after a verified sender and delivery credential are connected.</p></div>}<fieldset disabled={!emailAvailable}>{[["off", "No email", "Use only the notification bell and center."], ["immediate", "Email promptly", "Send each message or earnings warning as it is queued."], ["daily", "Daily digest", "Combine queued research and message alerts into one summary."]].map(([value, label, description]) => <label className={preferences.emailFrequency === value ? "selected" : ""} key={value}><input type="radio" name="emailFrequency" value={value} checked={preferences.emailFrequency === value} onChange={() => setPreferences({ ...preferences, emailFrequency: value })} /><span><strong>{label}</strong><small>{description}</small></span></label>)}</fieldset><label className="email-preview-toggle"><input type="checkbox" disabled={!emailAvailable || preferences.emailFrequency === "off"} checked={preferences.emailMessagePreview} onChange={(event) => setPreferences({ ...preferences, emailMessagePreview: event.target.checked })} /><span><strong>Include the message subject</strong><small>The message body is never included. Leave this off for maximum privacy.</small></span></label>{error && <p className="form-error">{error}</p>}{notice && <p className="message-notice">{notice}</p>}<button disabled={saving || !emailAvailable} onClick={() => void savePreferences()}>{saving ? "Saving…" : "Save email preferences"}</button><small className="notification-security-note">Email addresses remain private and are never shared with the sender.</small></aside></section>;
}
