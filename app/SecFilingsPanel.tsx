function secTicker(ticker: string) {
  return ticker.replace(/[./]/g, "-");
}

function entityUrl(ticker: string) {
  return `https://www.sec.gov/edgar/browse/?CIK=${encodeURIComponent(secTicker(ticker))}&owner=exclude`;
}

function formSearchUrl(ticker: string, forms: string[]) {
  return `https://www.sec.gov/edgar/search/#/entityName=${encodeURIComponent(secTicker(ticker))}&forms=${encodeURIComponent(forms.join(","))}`;
}

const filingGroups = [
  {
    code: "ALL",
    title: "All SEC filings",
    detail: "Complete EDGAR company filing history",
    forms: null,
  },
  {
    code: "10-K",
    title: "Annual reports",
    detail: "10-K, 20-F and 40-F filings",
    forms: ["10-K", "10-K/A", "20-F", "20-F/A", "40-F", "40-F/A"],
  },
  {
    code: "10-Q",
    title: "Quarterly reports",
    detail: "10-Q and foreign-issuer 6-K filings",
    forms: ["10-Q", "10-Q/A", "6-K", "6-K/A"],
  },
  {
    code: "8-K",
    title: "Earnings & current reports",
    detail: "8-K and 6-K company updates",
    forms: ["8-K", "8-K/A", "6-K", "6-K/A"],
  },
] as const;

export function SecFilingsPanel({ ticker }: { ticker: string }) {
  return (
    <section className="sec-filings-panel" id="filings">
      <div className="sec-filings-heading">
        <div>
          <span className="kicker">Official primary sources</span>
          <h2>SEC EDGAR filings</h2>
        </div>
        <a href="https://www.sec.gov/search-filings" target="_blank" rel="noreferrer">
          About EDGAR ↗
        </a>
      </div>

      <p>
        Open {ticker}&apos;s official filing history or jump directly to annual,
        quarterly, and earnings-related reports on the SEC website.
      </p>

      <div className="sec-filing-links">
        {filingGroups.map((group) => (
          <a
            href={
              group.forms
                ? formSearchUrl(ticker, [...group.forms])
                : entityUrl(ticker)
            }
            key={group.code}
            target="_blank"
            rel="noreferrer"
          >
            <span>{group.code}</span>
            <div>
              <strong>{group.title}</strong>
              <small>{group.detail}</small>
            </div>
            <em>View on SEC.gov ↗</em>
          </a>
        ))}
      </div>

      <small className="sec-availability">
        Filing availability varies by issuer. Foreign private issuers may use
        Forms 20-F, 40-F, or 6-K instead of Forms 10-K, 10-Q, or 8-K.
      </small>
    </section>
  );
}
