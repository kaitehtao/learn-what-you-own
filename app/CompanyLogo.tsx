"use client";

import { useState } from "react";
import Image from "next/image";

type CompanyLogoProps = {
  ticker: string;
  companyName?: string;
  size?: "compact" | "card" | "hero";
  eager?: boolean;
};

function imageTicker(ticker: string) {
  return ticker.trim().toUpperCase().replaceAll(".", "-").replaceAll("/", "-").replace(/[^A-Z0-9-]/g, "");
}

export function CompanyLogo({ ticker, companyName, size = "compact", eager = false }: CompanyLogoProps) {
  const normalizedTicker = ticker.trim().toUpperCase();
  const [failedSymbol, setFailedSymbol] = useState("");
  const symbol = imageTicker(normalizedTicker);
  const failed = failedSymbol === symbol;

  return <span className={`company-logo company-logo-${size}`} title={`${companyName ?? normalizedTicker} · ${normalizedTicker}`}>
    <span className="company-logo-image">
      {!failed && symbol ? <Image
        src={`https://financialmodelingprep.com/image-stock/${encodeURIComponent(symbol)}.png`}
        alt={`${companyName ?? normalizedTicker} logo`}
        width={66}
        height={66}
        unoptimized
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        onError={() => setFailedSymbol(symbol)}
      /> : <b aria-hidden="true">◆</b>}
    </span>
    <small>{normalizedTicker}</small>
  </span>;
}
