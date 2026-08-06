"use client";

import { useState } from "react";

type CompanyLogoProps = {
  ticker: string;
  companyName?: string;
  size?: "compact" | "card" | "hero";
  eager?: boolean;
};

type LogoContrast = { symbol: string; needsDarkBackground: boolean };

function imageTicker(ticker: string) {
  return ticker.trim().toUpperCase().replaceAll(".", "-").replaceAll("/", "-").replace(/[^A-Z0-9-]/g, "");
}

export function needsDarkLogoBackground(pixels: Uint8ClampedArray) {
  let visibleWeight = 0;
  let brightnessTotal = 0;
  let brightWeight = 0;

  for (let index = 0; index < pixels.length; index += 4) {
    const alpha = pixels[index + 3] / 255;
    if (alpha < 0.1) continue;
    const brightness = 0.2126 * pixels[index] + 0.7152 * pixels[index + 1] + 0.0722 * pixels[index + 2];
    visibleWeight += alpha;
    brightnessTotal += brightness * alpha;
    if (brightness >= 215) brightWeight += alpha;
  }

  if (visibleWeight === 0) return false;
  return brightnessTotal / visibleWeight >= 205 && brightWeight / visibleWeight >= 0.6;
}

export function CompanyLogo({ ticker, companyName, size = "compact", eager = false }: CompanyLogoProps) {
  const normalizedTicker = ticker.trim().toUpperCase();
  const [failedSymbol, setFailedSymbol] = useState("");
  const [contrast, setContrast] = useState<LogoContrast>({ symbol: "", needsDarkBackground: false });
  const symbol = imageTicker(normalizedTicker);
  const failed = failedSymbol === symbol;
  const needsDarkBackground = contrast.symbol === symbol && contrast.needsDarkBackground;

  function detectContrast(image: HTMLImageElement) {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 32;
      canvas.height = 32;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return;
      context.clearRect(0, 0, 32, 32);
      context.drawImage(image, 0, 0, 32, 32);
      const pixels = context.getImageData(0, 0, 32, 32).data;
      setContrast({ symbol, needsDarkBackground: needsDarkLogoBackground(pixels) });
    } catch {
      setContrast({ symbol, needsDarkBackground: false });
    }
  }

  return <span className={`company-logo company-logo-${size}${needsDarkBackground ? " company-logo-light-artwork" : ""}`} title={`${companyName ?? normalizedTicker} · ${normalizedTicker}`}>
    <span className="company-logo-image">
      {/* A native image preserves crossorigin for canvas-based contrast detection. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {!failed && symbol ? <img
        src={`https://financialmodelingprep.com/image-stock/${encodeURIComponent(symbol)}.png`}
        alt={`${companyName ?? normalizedTicker} logo`}
        width={66}
        height={66}
        crossOrigin="anonymous"
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        onLoad={(event) => detectContrast(event.currentTarget)}
        onError={() => setFailedSymbol(symbol)}
      /> : <b aria-hidden="true">◆</b>}
    </span>
    <small>{normalizedTicker}</small>
  </span>;
}
