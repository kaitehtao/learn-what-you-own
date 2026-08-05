export type CompanyMarketSnapshot = {
  ticker: string;
  price: number | null;
  marketCap: number | null;
  asOf: string;
  marketStatus: string;
  isRealTime: boolean;
  sourceLabel: string;
  sourceUrl: string;
};

export function formatStockPrice(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "Unavailable";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value < 1 ? 4 : 2,
    maximumFractionDigits: value < 1 ? 4 : 2,
  }).format(value);
}

export function formatMarketCap(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "Unavailable";
  const scale = value >= 1e12 ? [1e12, "T"] as const : value >= 1e9 ? [1e9, "B"] as const : value >= 1e6 ? [1e6, "M"] as const : [1, ""] as const;
  const scaled = value / scale[0];
  return `$${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: scale[1] && Math.abs(scaled) < 10 ? 1 : 0,
  }).format(scaled)}${scale[1]}`;
}
