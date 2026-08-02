const brokerages = [
  {
    name: "E*TRADE from Morgan Stanley",
    mark: "E*TRADE",
    className: "etrade",
    host: "us.etrade.com",
    loginUrl: "https://us.etrade.com/e/t/user/login",
    openUrl: "https://us.etrade.com/what-we-offer/our-accounts/brokerage-account",
  },
  {
    name: "Fidelity Investments",
    mark: "FIDELITY",
    className: "fidelity",
    host: "fidelity.com",
    loginUrl: "https://digital.fidelity.com/prgw/digital/login/full-page",
    openUrl: "https://www.fidelity.com/open-account/overview/",
  },
  {
    name: "Charles Schwab",
    mark: "SCHWAB",
    className: "schwab",
    host: "schwab.com",
    loginUrl: "https://client.schwab.com/Login/SignOn/CustomerCenterLogin.aspx",
    openUrl: "https://www.schwab.com/brokerage",
  },
  {
    name: "Morgan Stanley",
    mark: "MORGAN STANLEY",
    className: "morgan-stanley",
    host: "morganstanley.com",
    loginUrl: "https://www.morganstanley.com/online",
    openUrl: "https://www.morganstanley.com/what-we-do/wealth-management",
  },
  {
    name: "J.P. Morgan",
    mark: "J.P. MORGAN",
    className: "jpmorgan",
    host: "chase.com",
    loginUrl: "https://secure.chase.com/web/auth/dashboard#/dashboard/overviewAccounts/overview/index",
    openUrl: "https://www.chase.com/personal/investments/brokerage-account",
  },
  {
    name: "Interactive Brokers",
    mark: "IBKR",
    className: "interactive-brokers",
    host: "interactivebrokers.com",
    loginUrl: "https://www.interactivebrokers.com/sso/Login?RL=1",
    openUrl: "https://www.interactivebrokers.com/en/accounts/open_account.php",
  },
] as const;

const externalLinkProps = {
  target: "_blank",
  rel: "noopener noreferrer external",
} as const;

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
                  href={brokerage.loginUrl}
                  aria-label={`Sign in to ${brokerage.name} on its official website`}
                  {...externalLinkProps}
                >
                  Existing client login <span aria-hidden="true">↗</span>
                </a>
                <a
                  href={brokerage.openUrl}
                  aria-label={`Explore opening an account with ${brokerage.name} on its official website`}
                  {...externalLinkProps}
                >
                  Open / explore accounts <span aria-hidden="true">↗</span>
                </a>
              </div>
            </article>
          ))}
        </div>

        <p className="brokerage-disclaimer">
          Brokerage links are provided for convenience, not as endorsements or personalized
          recommendations. Account eligibility, features, fees, and availability are determined by
          each firm. Learn What You Own is not affiliated with these brokerages.
        </p>
      </div>
    </section>
  );
}
