"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CommunityInsights } from "./CommunityInsights";

type ConversationTab = "community" | "stocktwits";

const STOCKTWITS_WIDGET_LOADER = "https://widgets-api.stocktwits-cdn.com/loader.js";
const STOCKTWITS_WIDGET_ASSETS = "https://chunks-prd.stocktwits-cdn.com";

function stocktwitsSymbol(ticker: string) {
  return ticker.toUpperCase().replace(/[^A-Z0-9.-]/g, "").slice(0, 16);
}

export function CompanyConversations({ ticker }: { ticker: string }) {
  const symbol = stocktwitsSymbol(ticker);
  const [tab, setTab] = useState<ConversationTab>("community");
  const widgetHost = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tab !== "stocktwits" || !widgetHost.current || widgetHost.current.childElementCount) return;
    const script = document.createElement("script");
    script.async = true;
    script.src = STOCKTWITS_WIDGET_LOADER;
    script.dataset.cdnBase = STOCKTWITS_WIDGET_ASSETS;
    script.textContent = JSON.stringify({
      assetClass: "all",
      colorTheme: "light",
      location: "US",
      logos: true,
      quantity: 10,
      sparklines: true,
      transparent: true,
      widget: "cards",
    });
    widgetHost.current.appendChild(script);
  }, [tab]);

  const stocktwitsUrl = `https://stocktwits.com/symbol/${encodeURIComponent(symbol)}`;

  return <section className="company-conversations" id="conversations">
    <header className="conversation-heading">
      <div><span className="kicker">CONVERSATIONS</span><h2>Separate sourced research from the live market pulse</h2><p>LearnWhatYouOwn discussions remain moderated and evidence-linked. Stocktwits supplies a distinct view of retail attention and real-time conversation.</p></div>
      <Link href={`/research/community?ticker=${encodeURIComponent(symbol)}`}>Browse published research →</Link>
    </header>
    <div className="conversation-tabs" role="tablist" aria-label={`${symbol} conversation sources`}>
      <button type="button" role="tab" aria-selected={tab === "community"} aria-controls="community-conversation-panel" className={tab === "community" ? "active" : ""} onClick={() => setTab("community")}>LearnWhatYouOwn community</button>
      <button type="button" role="tab" aria-selected={tab === "stocktwits"} aria-controls="stocktwits-conversation-panel" className={tab === "stocktwits" ? "active" : ""} onClick={() => setTab("stocktwits")}>Stocktwits market pulse</button>
    </div>
    {tab === "community" ? <div id="community-conversation-panel" role="tabpanel">
      <CommunityInsights ticker={symbol} />
    </div> : <div id="stocktwits-conversation-panel" role="tabpanel" className="stocktwits-panel">
      <div className="stocktwits-context">
        <div><small>OFFICIAL STOCKTWITS CONNECTION</small><h3>${symbol} conversation and today’s trending symbols</h3><p>The approved widget shows market-wide trends. Stocktwits has not yet released its per-symbol embed, so the ticker stream opens on Stocktwits instead of being scraped or copied here.</p></div>
        <a href={stocktwitsUrl} target="_blank" rel="noreferrer">Open the official ${symbol} stream ↗</a>
      </div>
      <div className="stocktwits-widget-shell" ref={widgetHost} aria-label="Stocktwits trending stocks widget" />
      <footer><span>Third-party content · Loaded only when this tab is opened</span><a href="https://stocktwits.com/widgets" target="_blank" rel="noreferrer">Widget information ↗</a></footer>
    </div>}
  </section>;
}
