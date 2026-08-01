"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { authenticatedFetch } from "./supabase-browser";

type Notification = { id: number; kind: string; title: string; detail: string; href: string; readAt: string | null; createdAt: string };

function relativeTime(value: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
  return `${Math.floor(minutes / 1440)}d`;
}

export function NotificationBell({ signedIn }: { signedIn: boolean | null }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    if (!signedIn) return;
    const response = await authenticatedFetch("/api/notifications?compact=1", { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json() as { notifications?: Notification[]; unread?: number };
    setNotifications(data.notifications ?? []);
    setUnread(data.unread ?? 0);
  }, [signedIn]);

  useEffect(() => {
    if (!signedIn) return;
    const initialLoad = window.setTimeout(() => void load(), 0);
    const timer = window.setInterval(() => void load(), 30000);
    const refresh = () => void load();
    window.addEventListener("focus", refresh);
    window.addEventListener("lwy:notifications-changed", refresh);
    return () => { window.clearTimeout(initialLoad); window.clearInterval(timer); window.removeEventListener("focus", refresh); window.removeEventListener("lwy:notifications-changed", refresh); };
  }, [load, signedIn]);

  async function markRead(notification: Notification) {
    if (!notification.readAt) {
      setUnread((current) => Math.max(0, current - 1));
      setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item));
      await authenticatedFetch("/api/notifications", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "read", id: notification.id }) });
    }
  }

  async function markAllRead() {
    setUnread(0);
    setNotifications((current) => current.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })));
    await authenticatedFetch("/api/notifications", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "read_all" }) });
  }

  if (!signedIn) return null;
  return <details className="notification-bell"><summary aria-label={unread ? `${unread} unread notifications` : "Notifications"}><span>♢</span>{unread > 0 && <em>{unread > 99 ? "99+" : unread}</em>}</summary><div className="notification-popover"><header><div><span className="kicker">NOTIFICATIONS</span><strong>{unread ? `${unread} unread` : "You’re all caught up"}</strong></div>{unread > 0 && <button onClick={() => void markAllRead()}>Mark all read</button>}</header>{notifications.length ? <div className="notification-preview-list">{notifications.map((notification) => <Link className={notification.readAt ? "" : "unread"} href={notification.href} key={notification.id} onClick={() => void markRead(notification)}><i>{notification.kind === "public_message" ? "◎" : "✉"}</i><span><strong>{notification.title}</strong><small>{notification.detail}</small></span><time>{relativeTime(notification.createdAt)}</time></Link>)}</div> : <div className="notification-preview-empty"><span>✓</span><p>No notifications yet.</p></div>}<Link className="notification-view-all" href="/notifications">View all notifications &amp; settings →</Link></div></details>;
}
