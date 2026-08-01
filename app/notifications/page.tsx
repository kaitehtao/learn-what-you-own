import { Header } from "../ui";
import { NotificationsClient } from "./NotificationsClient";

export default function NotificationsPage() {
  return <main><Header /><section className="notifications-hero"><div className="container"><span className="kicker">MEMBER ALERTS</span><h1>Notifications without the noise.</h1><p>See private and public messages as they arrive, then decide whether email should alert you immediately, once a day, or never.</p></div></section><NotificationsClient /></main>;
}
