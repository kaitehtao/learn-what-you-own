import { Header } from "../ui";
import { MessagesClient } from "./MessagesClient";

export default function MessagesPage() {
  return <main><Header/><section className="messages-hero"><div className="container"><span className="kicker">PRIVATE MEMBER MESSAGES</span><h1>Talk through the research.</h1><p>Send private, account-to-account notes by username. Your email address is never shown to another member.</p></div></section><MessagesClient/></main>;
}
