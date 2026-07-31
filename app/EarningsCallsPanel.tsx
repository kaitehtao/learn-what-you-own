type EarningsCallsPanelProps = {
  ticker: string;
  investorRelationsUrl?: string;
};

const verifiedCallArchives: Record<string, { transcripts: string; audio: string }> = {
  NVDA: {
    transcripts: "https://investor.nvidia.com/financial-info/quarterly-results/",
    audio: "https://investor.nvidia.com/events-and-presentations/events-and-presentations/default.aspx",
  },
};

const verifiedYahooTranscripts: Record<string, { url: string; label: string }> = {
  AAPL: {
    url: "https://finance.yahoo.com/quote/AAPL/earnings/AAPL-Q3-2026-earnings_call-658553.html",
    label: "Q3 FY2026",
  },
};

export function EarningsCallsPanel({ ticker, investorRelationsUrl }: EarningsCallsPanelProps) {
  const symbol = ticker.toUpperCase();
  const verifiedYahooTranscript = verifiedYahooTranscripts[symbol];
  const yahooUrl = verifiedYahooTranscript?.url ?? `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}/earnings-calls/`;
  const podcastUrl = `https://podcasts.apple.com/us/search?term=${encodeURIComponent(`${symbol} earnings call`)}`;
  const officialSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(`${symbol} investor relations earnings call webcast`)}`;
  const verifiedArchive = verifiedCallArchives[symbol];
  const officialTranscriptUrl = verifiedArchive?.transcripts ?? investorRelationsUrl ?? officialSearchUrl;
  const officialAudioUrl = verifiedArchive?.audio ?? podcastUrl;

  return <section className="earnings-calls-panel" id="earnings-calls">
    <div className="earnings-calls-heading">
      <div><span className="kicker">MANAGEMENT COMMENTARY</span><h2>Earnings call transcripts &amp; audio</h2></div>
      <strong>{symbol}</strong>
    </div>
    <p>Read management’s prepared remarks and analyst Q&amp;A, then listen to the recording to evaluate emphasis, tone, and changes in language over time.</p>
    <div className="earnings-call-links">
      <a href={officialTranscriptUrl} target="_blank" rel="noreferrer">
        <span>01</span><div><small>PRIMARY SOURCE · COMPANY IR</small><strong>{verifiedArchive ? "Read official transcripts and quarterly materials" : investorRelationsUrl ? "Open company earnings materials" : "Find company-published transcripts"}</strong><p>{verifiedArchive ? `Open ${symbol}’s verified investor-relations results archive.` : "Look for transcripts, prepared remarks, releases, and presentations published by the company."}</p></div><em>Open IR ↗</em>
      </a>
      <a href={officialAudioUrl} target="_blank" rel="noreferrer">
        <span>02</span><div><small>{verifiedArchive ? "PRIMARY SOURCE · COMPANY IR" : "CALL AUDIO"}</small><strong>{verifiedArchive ? "Listen to the official webcast or replay" : "Listen to earnings calls"}</strong><p>{verifiedArchive ? `Open ${symbol}’s verified company event and webcast archive.` : `Find available ${symbol} earnings-call recordings in Apple Podcasts.`}</p></div><em>Listen ↗</em>
      </a>
      <a href={yahooUrl} target="_blank" rel="noreferrer">
        <span>03</span><div><small>SECONDARY SOURCE · YAHOO / QUARTR</small><strong>{verifiedYahooTranscript ? `Read the ${verifiedYahooTranscript.label} printed transcript` : "Open the earnings-call transcript archive"}</strong><p>{verifiedYahooTranscript ? `Open the complete speaker-by-speaker ${symbol} transcript directly.` : `Go directly to ${symbol}’s dedicated Yahoo Finance earnings-calls page for available transcripts.`}</p></div><em>{verifiedYahooTranscript ? "Read transcript ↗" : "Open calls ↗"}</em>
      </a>
    </div>
    <p className="earnings-call-note">Transcripts can contain transcription errors. Verify material claims against the audio, earnings release, and SEC filings.</p>
  </section>;
}
