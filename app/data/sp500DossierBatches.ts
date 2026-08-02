export type DossierBatchCompany = {
  rank: number;
  ticker: string;
  name: string;
  marketCap: number;
  status: "complete" | "in progress" | "queued";
};

export const sp500DossierBatchAsOf = "July 30, 2026";
export const sp500DossierBatchSource = "https://www.nasdaq.com/market-activity/stocks/screener";

const batch01Rows: Array<[number, string, string, number]> = [
  [1, "AAPL", "Apple", 4_897_205_111_080],
  [2, "NVDA", "NVIDIA", 4_719_968_000_000],
  [3, "GOOG/GOOGL", "Alphabet", 4_080_906_400_000],
  [4, "MSFT", "Microsoft", 3_350_966_894_974],
  [5, "AMZN", "Amazon", 2_533_299_272_178],
  [6, "AVGO", "Broadcom", 1_845_179_903_992],
  [7, "META", "Meta Platforms", 1_368_286_313_555],
  [8, "TSLA", "Tesla", 1_219_817_712_637],
  [9, "BRK.B", "Berkshire Hathaway", 1_124_512_779_571],
  [10, "LLY", "Eli Lilly", 1_087_683_071_688],
  [11, "MU", "Micron Technology", 987_835_013_454],
  [12, "JPM", "JPMorgan Chase", 940_106_581_005],
  [13, "WMT", "Walmart", 884_142_594_121],
  [14, "AMD", "Advanced Micro Devices", 791_477_244_164],
  [15, "V", "Visa", 693_886_778_610],
  [16, "XOM", "Exxon Mobil", 650_632_356_019],
  [17, "JNJ", "Johnson & Johnson", 616_500_259_085],
  [18, "MA", "Mastercard", 510_137_138_684],
  [19, "INTC", "Intel", 459_659_720_000],
  [20, "ABBV", "AbbVie", 454_790_140_054],
  [21, "CSCO", "Cisco Systems", 447_589_320_557],
  [22, "BAC", "Bank of America", 438_072_540_886],
  [23, "COST", "Costco Wholesale", 423_154_170_413],
  [24, "AMAT", "Applied Materials", 398_385_023_191],
  [25, "CVX", "Chevron", 383_004_159_841],
  [26, "UNH", "UnitedHealth Group", 382_755_621_954],
  [27, "KO", "Coca-Cola", 380_874_488_086],
  [28, "CAT", "Caterpillar", 372_719_843_218],
  [29, "LRCX", "Lam Research", 372_319_998_120],
  [30, "GE", "GE Aerospace", 368_376_194_616],
];

export const sp500DossierBatch01: DossierBatchCompany[] = batch01Rows.map(([rank, ticker, name, marketCap]) => ({ rank, ticker, name, marketCap, status: "complete" }));
