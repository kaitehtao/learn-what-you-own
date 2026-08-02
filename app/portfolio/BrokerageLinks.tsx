import { brokerages } from "../brokerageDirectory";

export function BrokerageLinks() {
  return (
    <section className="brokerage-access">
      <div className="container">
        <header className="brokerage-access-heading">
          <div>
            <span className="kicker">OFFICIAL BROKERAGE ACCESS</span>
            <h2>Continue securely at your brokerage.</h2>
          </div>
          <p>
            Use these shortcuts to sign in to an existing account or explore opening a new one.
            Every action opens the brokerage firm&apos;s official website in a new tab.
          </p>
        </header>

        <aside className="brokerage-security-notice" aria-label="Brokerage security notice">
          <strong>Protect your credentials.</strong>
          <span>
            Learn What You Own never asks for, receives, or stores your brokerage username,
            password, account number, or application information. Confirm the displayed official
            domain before signing in.
          </span>
        </aside>

        <div className="brokerage-grid">
          {brokerages.map((brokerage) => (
            <article className="brokerage-card" key={brokerage.name}>
              <div className={`brokerage-logo ${brokerage.className}`} aria-label={`${brokerage.name} logo`}>
                {brokerage.mark}
              </div>
              <div className="brokerage-card-copy">
                <h3>{brokerage.name}</h3>
                <span className="brokerage-domain">Official domain: {brokerage.host}</span>
              </div>
              <div className="brokerage-actions">
                <a
                  href={`/api/brokerage-click?broker=${encodeURIComponent(brokerage.key)}&action=login`}
                  aria-label={`Sign in to ${brokerage.name} on its official website`}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                >
                  Existing client login <span aria-hidden="true">↗</span>
                </a>
                <a
                  href={`/api/brokerage-click?broker=${encodeURIComponent(brokerage.key)}&action=open`}
                  aria-label={`Explore opening an account with ${brokerage.name} on its official website`}
                  target="_blank"
                  rel="noopener noreferrer sponsored nofollow"
                >
                  Open / explore accounts <span aria-hidden="true">↗</span>
                </a>
              </div>
            </article>
          ))}
        </div>

        <p className="brokerage-disclaimer">
          <strong>Affiliate disclosure:</strong> Learn What You Own may receive compensation if you
          open an eligible account through a participating link, at no additional cost to you. Paid
          relationships never determine research coverage, rankings, or conclusions. Brokerage links
          are provided for convenience, not as endorsements or personalized recommendations.
          Account eligibility, features, fees, and availability are determined by each firm.
        </p>
      </div>
    </section>
  );
}
