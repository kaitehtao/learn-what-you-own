import { Header } from "../ui";
import { PortfolioClient } from "./PortfolioClient";

export default function PortfolioPage() {
  return <main><Header/><section className="portfolio-hero"><div className="container"><span className="kicker">YOUR PORTFOLIO</span><h1>Connect your research<br/>to what you own.</h1><p>Add holdings manually for this prototype. Position data is private to your account and is used to organize research—not to give personalized investment advice.</p></div></section><PortfolioClient/></main>;
}
