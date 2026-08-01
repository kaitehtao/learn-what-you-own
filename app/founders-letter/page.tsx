import Link from "next/link";
import { Header } from "../ui";

export default function FoundersLetterPage() {
  return (
    <main>
      <Header />
      <article className="container founder-letter-page">
        <header>
          <span className="kicker">A LETTER FROM THE FOUNDER</span>
          <h1>We believe ownership should come with understanding.</h1>
          <p>Written by @Yourhost · Founder, public host, and moderator</p>
        </header>
        <section>
          <p className="founder-letter-lede">Every day, millions of people invest in businesses they do not fully understand.</p>
          <p>They receive fragments of information from earnings releases, filings, financial news, social media, analysts, and market commentary. The information is everywhere, but the context needed to make sense of it is scattered.</p>
          <p>We created LearnWhatYouOwn because ownership should come with understanding.</p>
          <p>Our goal is not simply to provide more financial information. It is to help people learn what they own, understand why it matters, identify what has changed, and make more informed decisions.</p>
          <h2>We are beginning with public equities.</h2>
          <p>We have built an extensive equity intelligence engine that brings together company fundamentals, market data, filings, news, artificial intelligence, education, and community expertise. Public equities are our first product because they offer a powerful starting point: millions of owners, extensive public information, and an urgent need for clearer understanding.</p>
          <p>But data and artificial intelligence alone are not enough.</p>
          <p>The most valuable insights often come from people with direct experience—investors, operators, engineers, customers, researchers, entrepreneurs, and industry specialists. Knowledge is distributed across the crowd. Our role is to organize that expertise, test it against evidence, and make the best insights accessible to the entire community.</p>
          <blockquote><span>Artificial intelligence helps us process information at scale.</span><span>Our community provides judgment, context, and lived experience.</span><strong>Together, they create a new form of Ownership Intelligence.</strong></blockquote>
          <p>We are building a community centered on education, evidence, curiosity, transparency, and exclusive insight. We want every member to leave the platform understanding something they did not understand before.</p>
          <p>We will not measure success only by traffic, subscriptions, or engagement. We will measure it by whether our members become more informed, more confident, and more capable of thinking independently about the companies and assets they own.</p>
          <p>Public equities are where we begin.</p>
          <p>Helping people understand ownership is where we are going.</p>
          <p className="founder-letter-close">Together, we will learn what we own.</p>
          <div className="founder-letter-actions"><Link className="button dark-button" href="/company/amc">Explore the featured AMC dossier</Link><Link className="button" href="/contribute">Contribute evidence</Link></div>
        </section>
      </article>
    </main>
  );
}
