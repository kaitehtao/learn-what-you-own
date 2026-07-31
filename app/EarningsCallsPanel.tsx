type EarningsCallsPanelProps = {
  ticker: string;
  investorRelationsUrl?: string;
};

export function EarningsCallsPanel({ ticker, investorRelationsUrl }: EarningsCallsPanelProps) {
  const symbol = ticker.toUpperCase();
  const yahooUrl = `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}/earnings/`;
  const podcastUrl = `https://podcasts.apple.com/us/search?term=${encodeURIComponent(`${symbol} earnings call`)}`;
  const officialSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(`${symbol} investor relations earnings call webcast`)}`;

  return <section className="earnings-calls-panel" id="earnings-calls">
    <div className="earnings-calls-heading">
      <div><span className="kicker">MANAGEMENT COMMENTARY</span><h2>Earnings call transcripts &amp; audio</h2></div>
      <strong>{symbol}</strong>
    </div>
    <p>Read management’s prepared remarks and analyst Q&amp;A, then listen to the recording to evaluate emphasis, tone, and changes in language over time.</p>
    <div className="earnings-call-links">
      <a href={yahooUrl} target="_blank" rel="noreferrer">
        <span>01</span><div><small>TRANSCRIPTS</small><strong>Read earnings call transcripts</strong><p>Open {symbol}’s earnings and transcript hub on Yahoo Finance.</p></div><em>Read ↗</em>
      </a>
      <a href={podcastUrl} target="_blank" rel="noreferrer">
        <span>02</span><div><small>CALL AUDIO</small><strong>Listen to earnings calls</strong><p>Find available {symbol} earnings-call recordings in Apple Podcasts.</p></div><em>Listen ↗</em>
      </a>
      <a href={investorRelationsUrl ?? officialSearchUrl} target="_blank" rel="noreferrer">
        <span>03</span><div><small>OFFICIAL WEBCAST</small><strong>{investorRelationsUrl ? "Open company investor relations" : "Find the official company webcast"}</strong><p>Prefer the company-hosted live call or replay when available.</p></div><em>Open ↗</em>
      </a>
    </div>
    <p className="earnings-call-note">Transcripts can contain transcription errors. Verify material claims against the audio, earnings release, and SEC filings.</p>
  </section>;
}
