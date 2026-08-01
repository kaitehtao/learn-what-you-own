import Link from "next/link";

export function AccessComparison() {
  return (
    <section className="container access-comparison" aria-labelledby="access-comparison-title">
      <div className="access-comparison-heading">
        <span className="kicker">PUBLIC RESEARCH · PRIVATE WORKSPACE</span>
        <h2 id="access-comparison-title">Read freely. Join when you want the research to work for you.</h2>
        <p>Core company research stays publicly readable. A free verified account adds private tools, alerts, and a voice in what we build next.</p>
      </div>
      <div className="access-comparison-grid">
        <article>
          <span className="access-label">WITHOUT AN ACCOUNT</span>
          <h3>Explore the evidence</h3>
          <ul>
            <li>Search the full company universe</li>
            <li>Read public ownership dossiers</li>
            <li>Open cited SEC filings and primary sources</li>
            <li>View earnings, interviews, and approved community research</li>
          </ul>
          <Link href="/companies">Browse companies <span>→</span></Link>
        </article>
        <article className="member-access-card">
          <span className="access-label">WITH A FREE ACCOUNT</span>
          <h3>Build your owner workspace</h3>
          <ul>
            <li>Create private watchlists, portfolios, and research notebooks</li>
            <li>Receive company-change notifications and manage alerts</li>
            <li>Upvote research priorities and follow other members</li>
            <li>Submit sourced research and product feedback for moderation</li>
          </ul>
          <Link className="button dark-button" href="/login?mode=signup">Create a free account</Link>
          <small>Your email, phone number, portfolio, watchlist, and notebook are not displayed publicly.</small>
        </article>
      </div>
    </section>
  );
}
