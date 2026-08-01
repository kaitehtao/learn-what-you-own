import { Header } from "../ui";
import { WatchlistClient } from "./WatchlistClient";

export default function WatchlistPage() {
  return <main><Header/><section className="watchlist-hero"><div className="container"><span className="kicker">YOUR WATCHLIST</span><h1>Follow understanding,<br/>not price movement.</h1><p>Your private list of businesses, with the evidence, thesis changes, filings, and management statements worth revisiting.</p></div></section><WatchlistClient/></main>;
}
