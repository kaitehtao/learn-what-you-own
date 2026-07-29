import {
  getSecCompany,
  secCompaniesGeneratedAsOf,
} from "./data/secCompanies.generated";

type FilingGroup = {
  code: string;
  title: string;
  detail: string;
  forms: string[] | null;
};

const filingGroups: FilingGroup[] = [
  {
    code: "ALL",
    title: "All SEC filings",
    detail: "Complete EDGAR filing history for this exact filer",
    forms: null,
  },
  {
    code: "10-K",
    title: "Annual reports",
    detail: "Forms 10-K, 20-F and 40-F, including amendments",
    forms: ["10-K", "20-F", "40-F"],
  },
  {
    code: "10-Q",
    title: "Quarterly reports",
    detail: "Forms 10-Q and related amendments",
    forms: ["10-Q"],
  },
  {
    code: "PROXY",
    title: "Proxy statements",
    detail: "Forms DEF 14A, DEFA14A, PRE 14A and 14C materials",
    forms: ["DEF 14A", "DEFA14A", "PRE 14A", "DEF 14C", "PRE 14C"],
  },
  {
    code: "8-K",
    title: "Current and earnings reports",
    detail: "Forms 8-K and foreign-issuer 6-K reports",
    forms: ["8-K", "6-K"],
  },
  {
    code: "OWN",
    title: "Ownership filings",
    detail: "Forms 3, 4, 5 and Schedules 13D and 13G",
    forms: ["3", "4", "5", "SC 13D", "SC 13G"],
  },
];

const fdicFilers: Record<
  string,
  { name: string; filingsUrl: string; detail: string }
> = {
  FRBA: {
    name: "First Bank",
    filingsUrl: "https://frba.q4ir.com/financials/sec-filings/default.aspx",
    detail: "10-K, 10-Q, proxy, 8-K and ownership filings",
  },
  HIFS: {
    name: "Hingham Institution for Savings",
    filingsUrl: "https://www.hinghamsavings.com/investor-materials",
    detail: "10-K, 10-Q, proxy, earnings and ownership materials",
  },
  NBN: {
    name: "Northeast Bank",
    filingsUrl: "https://investor.northeastbank.com/financial-information/fdic",
    detail: "10-K, 10-Q, proxy, 8-K and ownership filings",
  },
  TOWN: {
    name: "TowneBank",
    filingsUrl:
      "https://investor.townebank.com/financials/filing-documents/default.aspx",
    detail: "10-K, 10-Q, proxy, 8-K and other FDIC filings",
  },
};

function entityUrl(cik: string) {
  return `https://www.sec.gov/edgar/browse/?CIK=${cik}&owner=exclude`;
}

function formSearchUrl(cik: string, entityName: string, forms: string[]) {
  const params = new URLSearchParams({
    ciks: cik,
    entityName,
    category: "custom",
    forms: forms.join(","),
  });
  return `https://www.sec.gov/edgar/search/#/${params.toString()}`;
}

function FdicFilingsPanel({ ticker }: { ticker: string }) {
  const filer = fdicFilers[ticker];

  return (
    <section className="sec-filings-panel" id="filings">
      <div className="sec-filings-heading">
        <div>
          <span className="kicker">Official regulatory sources</span>
          <h2>FDIC filings</h2>
        </div>
        <a
          href="https://efr.fdic.gov/fcxweb/efr/index.html"
          target="_blank"
          rel="noreferrer"
        >
          FDIC filing system ↗
        </a>
      </div>

      <p>
        {filer.name} ({ticker}) files its periodic securities reports with the
        FDIC rather than SEC EDGAR. The verified company filing library below
        provides the applicable reports.
      </p>

      <div className="sec-filing-links">
        <a href={filer.filingsUrl} target="_blank" rel="noreferrer">
          <span>FDIC</span>
          <div>
            <strong>{filer.name} regulatory filings</strong>
            <small>{filer.detail}</small>
          </div>
          <em>Open official filing library ↗</em>
        </a>
      </div>

      <small className="sec-availability">
        Regulatory source verified for {ticker}. SEC EDGAR links are not shown
        because they would not contain this bank&apos;s periodic reports.
      </small>
    </section>
  );
}

export function SecFilingsPanel({ ticker }: { ticker: string }) {
  const normalizedTicker = ticker.toUpperCase();
  const secCompany = getSecCompany(normalizedTicker);

  if (!secCompany && fdicFilers[normalizedTicker]) {
    return <FdicFilingsPanel ticker={normalizedTicker} />;
  }

  if (!secCompany) {
    return (
      <section className="sec-filings-panel" id="filings">
        <span className="kicker">Official regulatory sources</span>
        <h2>Filer match unavailable</h2>
        <p>
          An exact SEC CIK match has not been verified for {normalizedTicker}.
          Filing links are withheld to avoid directing you to the wrong company.
        </p>
        <a
          className="sec-manual-search"
          href="https://www.sec.gov/search-filings"
          target="_blank"
          rel="noreferrer"
        >
          Search SEC EDGAR manually ↗
        </a>
      </section>
    );
  }

  return (
    <section className="sec-filings-panel" id="filings">
      <div className="sec-filings-heading">
        <div>
          <span className="kicker">Official primary sources</span>
          <h2>SEC EDGAR filings</h2>
        </div>
        <a href={entityUrl(secCompany.cik)} target="_blank" rel="noreferrer">
          Open filer profile ↗
        </a>
      </div>

      <p>
        These links are locked to {secCompany.name} using SEC CIK{" "}
        <strong>{secCompany.cik}</strong>, so results cannot drift to another
        company with a similar name or ticker.
      </p>

      <div className="sec-filer-match">
        <span>VERIFIED FILER</span>
        <strong>{secCompany.name}</strong>
        <small>
          SEC ticker {secCompany.secTicker} · CIK {secCompany.cik}
        </small>
      </div>

      {secCompany.note && <p className="sec-filer-note">{secCompany.note}</p>}

      <div className="sec-filing-links">
        {filingGroups.map((group) => (
          <a
            href={
              group.forms
                ? formSearchUrl(secCompany.cik, secCompany.name, group.forms)
                : entityUrl(secCompany.cik)
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
            <em>View matching filings ↗</em>
          </a>
        ))}
      </div>

      <small className="sec-availability">
        Ticker-to-CIK associations were refreshed from the SEC&apos;s official
        company ticker file on {secCompaniesGeneratedAsOf}. Filing availability
        varies by issuer.
      </small>
    </section>
  );
}
