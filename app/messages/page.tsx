import { Header } from "../ui";
import { MessagesClient } from "./MessagesClient";

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ to?: string | string[]; visibility?: string | string[] }> }) {
  const resolved = await searchParams;
  const rawRecipient = Array.isArray(resolved.to) ? resolved.to[0] : resolved.to;
  const candidate = (rawRecipient ?? "").replace(/^@/, "").slice(0, 24);
  const initialRecipientUsername = /^[A-Za-z0-9_]{3,24}$/.test(candidate) ? candidate : "";
  const rawVisibility = Array.isArray(resolved.visibility) ? resolved.visibility[0] : resolved.visibility;
  const initialVisibility = rawVisibility === "public" ? "public" : "private";

  return <main><Header/><section className="messages-hero"><div className="container"><span className="kicker">PRIVATE MEMBER MESSAGES</span><h1>Talk through the research.</h1><p>Send private, account-to-account notes by username. Your email address is never shown to another member.</p></div></section><MessagesClient initialRecipientUsername={initialRecipientUsername} initialVisibility={initialVisibility}/></main>;
}
