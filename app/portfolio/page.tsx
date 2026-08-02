import { Header } from "../ui";
import { BrokerageLinks } from "./BrokerageLinks";
import { PortfolioClient } from "./PortfolioClient";

export default function PortfolioPage() {
  return <main><Header/><section className="portfolio-hero"><div className="container"><span className="kicker">YOUR PORTFOLIO</span><h1>Know what you own<br/>and what it is worth.</h1><p>Track shares, average purchase price, current market value, cost basis, and unrealized gain or loss. Position data remains private to your account and is used to organize research—not to give individualized investment advice.</p></div></section><PortfolioClient/><BrokerageLinks/></main>;
}
