import type { SupabaseClient } from "@supabase/supabase-js";
import { officialEarningsVerifications, type EarningsSession } from "./data/earningsVerifications";

const NASDAQ_EARNINGS_URL = "https://api.nasdaq.com/api/analyst";
const ALERT_WINDOW_DAYS = 7;

type NasdaqEarningsPayload = {
  data?: {
    reportText?: string | null;
    announcement?: string | null;
  } | null;
};

export type EarningsCalendarRecord = {
  ticker: string;
  earnings_date: string | null;
  session: EarningsSession;
  verification_status: "company-confirmed" | "provider-estimate" | "date-unavailable";
  announced_time: string;
  source_url: string;
  source_label: string;
  provider_text: string;
  checked_at: string;
};

type WatchlistOwner = { user_id: string; ticker: string };

function isoDate(value: string) {
  const match = value.match(/^([A-Za-z]{3})\s+(\d{1,2}),\s+(\d{4})$/);
  if (!match) return null;
  const month = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].indexOf(match[1].toLowerCase());
  if (month < 0) return null;
  const date = new Date(Date.UTC(Number(match[3]), month, Number(match[2])));
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function pacificDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function daysUntilEarnings(earningsDate: string, today = pacificDate()) {
  const target = Date.parse(`${earningsDate}T12:00:00Z`);
  const start = Date.parse(`${today}T12:00:00Z`);
  return Math.round((target - start) / 86_400_000);
}

export function earningsSessionLabel(session: EarningsSession) {
  if (session === "BMO") return "Before market open";
  if (session === "AMC") return "After market close";
  return "Time not supplied";
}

function sessionFromText(reportText: string): EarningsSession {
  const normalized = reportText.toLowerCase();
  if (normalized.includes("before market open")) return "BMO";
  if (normalized.includes("after market close")) return "AMC";
  return "TNS";
}

function officialVerification(ticker: string, date: string | null) {
  return date ? officialEarningsVerifications.get(`${date}:${ticker}`) : undefined;
}

export async function fetchNasdaqEarningsDate(tickerValue: string): Promise<EarningsCalendarRecord> {
  const ticker = tickerValue.trim().toUpperCase();
  if (!/^[A-Z0-9.-]{1,12}$/.test(ticker)) throw new Error("Invalid ticker");
  const response = await fetch(`${NASDAQ_EARNINGS_URL}/${encodeURIComponent(ticker)}/earnings-date`, {
    headers: { accept: "application/json", "user-agent": "Learn What You Own earnings alerts" },
    next: { revalidate: 21_600 },
  });
  if (!response.ok) throw new Error(`Earnings provider returned ${response.status}`);
  const payload = await response.json() as NasdaqEarningsPayload;
  const announcement = payload.data?.announcement ?? "";
  const reportText = payload.data?.reportText ?? "";
  const announcedDate = announcement.match(/:\s*([A-Za-z]{3}\s+\d{1,2},\s+\d{4})/)?.[1] ?? "";
  const earningsDate = isoDate(announcedDate);
  const verification = officialVerification(ticker, earningsDate);
  const session = verification?.session ?? sessionFromText(reportText);

  return {
    ticker,
    earnings_date: earningsDate,
    session,
    verification_status: verification ? "company-confirmed" : earningsDate ? "provider-estimate" : "date-unavailable",
    announced_time: verification?.announcedTime ?? earningsSessionLabel(session),
    source_url: verification?.sourceUrl ?? `https://www.nasdaq.com/market-activity/stocks/${encodeURIComponent(ticker.toLowerCase())}/earnings`,
    source_label: verification?.sourceLabel ?? "Nasdaq earnings date",
    provider_text: reportText || announcement,
    checked_at: new Date().toISOString(),
  };
}

async function mapWithConcurrency<T, R>(values: T[], limit: number, work: (value: T) => Promise<R>) {
  const results = new Array<R>(values.length);
  let cursor = 0;
  async function worker() {
    while (cursor < values.length) {
      const index = cursor++;
      results[index] = await work(values[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, () => worker()));
  return results;
}

export async function refreshEarningsCalendar(_admin: SupabaseClient, tickerValues: string[]) {
  const tickers = [...new Set(tickerValues.map((ticker) => ticker.trim().toUpperCase()).filter(Boolean))];
  const records = new Map<string, EarningsCalendarRecord>();
  if (!tickers.length) return records;
  const refreshed = await mapWithConcurrency(tickers, 8, async (ticker) => {
    try {
      return await fetchNasdaqEarningsDate(ticker);
    } catch (caught) {
      console.error(`Unable to refresh earnings date for ${ticker}`, caught);
      return null;
    }
  });
  const available = refreshed.filter((record): record is EarningsCalendarRecord => Boolean(record));
  for (const record of available) records.set(record.ticker, record);
  return records;
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" }).format(new Date(`${value}T12:00:00Z`));
}

export async function createDueEarningsAlerts(admin: SupabaseClient, owners: WatchlistOwner[], calendar: Map<string, EarningsCalendarRecord>) {
  const due = owners.flatMap((owner) => {
    const event = calendar.get(owner.ticker);
    if (!event?.earnings_date) return [];
    const daysUntil = daysUntilEarnings(event.earnings_date);
    return daysUntil >= 0 && daysUntil <= ALERT_WINDOW_DAYS ? [{ ...owner, event, daysUntil }] : [];
  });
  if (!due.length) return { alerts: 0, emailsQueued: 0 };

  const notificationRows = due.map((detail) => {
    const timing = earningsSessionLabel(detail.event.session).toLowerCase();
    const status = detail.event.verification_status === "company-confirmed" ? "Company confirmed." : "Provider estimate; dates can change.";
    const countdown = detail.daysUntil === 0 ? "today" : detail.daysUntil === 1 ? "tomorrow" : `in ${detail.daysUntil} days`;
    return {
      user_id: detail.user_id,
      actor_id: null,
      kind: "private_message",
      title: `${detail.ticker} reports earnings ${countdown}`,
      detail: `Expected ${dateLabel(detail.event.earnings_date!)} ${timing}. ${status}`,
      href: `/company/${detail.ticker.toLowerCase()}#earnings-calls`,
      entity_type: "earnings_alert",
      entity_id: earningsAlertIdentity(detail.ticker, detail.event.earnings_date!),
    };
  });
  const { data: notifications, error: notificationError } = await admin.from("notifications").upsert(notificationRows, { onConflict: "user_id,entity_type,entity_id" }).select("id,user_id");
  if (notificationError) throw notificationError;

  const userIds = [...new Set(due.map((item) => item.user_id))];
  await admin.from("notification_preferences").upsert(userIds.map((user_id) => ({ user_id })), { onConflict: "user_id", ignoreDuplicates: true });
  const { data: preferences, error: preferenceError } = await admin.from("notification_preferences").select("user_id,email_frequency").in("user_id", userIds);
  if (preferenceError) throw preferenceError;
  const frequency = new Map((preferences ?? []).map((preference) => [preference.user_id, preference.email_frequency]));
  const outbox = (notifications ?? []).flatMap((notification) => {
    const selected = frequency.get(notification.user_id);
    return selected === "immediate" || selected === "daily" ? [{ notification_id: notification.id, user_id: notification.user_id, frequency: selected, next_attempt_at: new Date().toISOString() }] : [];
  });
  if (outbox.length) {
    const { error: outboxError } = await admin.from("email_notification_outbox").upsert(outbox, { onConflict: "notification_id", ignoreDuplicates: true });
    if (outboxError) throw outboxError;
  }
  return { alerts: notificationRows.length, emailsQueued: outbox.length };
}

function earningsAlertIdentity(ticker: string, earningsDate: string) {
  const value = `${ticker}:${earningsDate}`;
  function hash(seed: number) {
    let result = seed;
    for (let index = 0; index < value.length; index += 1) {
      result ^= value.charCodeAt(index);
      result = Math.imul(result, 16_777_619);
    }
    return (result >>> 0) % 10_000_000;
  }
  return `${hash(2_166_136_261)}`.padStart(7, "0") + `${hash(3_747_613_931)}`.padStart(7, "0");
}

export async function refreshAllWatchlistEarningsAlerts(admin: SupabaseClient) {
  const { data: owners, error } = await admin.from("watchlist_items").select("user_id,ticker");
  if (error) throw error;
  const watchlistOwners = (owners ?? []) as WatchlistOwner[];
  const calendar = await refreshEarningsCalendar(admin, watchlistOwners.map((owner) => owner.ticker));
  return { companiesChecked: calendar.size, ...(await createDueEarningsAlerts(admin, watchlistOwners, calendar)) };
}
