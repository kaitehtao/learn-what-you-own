export type EarningsSession = "BMO" | "AMC" | "TNS";

export type OfficialEarningsVerification = {
  ticker: string;
  date: string;
  session: EarningsSession;
  announcedTime: string;
  sourceUrl: string;
  sourceLabel: string;
  verifiedAt: string;
};

const records: OfficialEarningsVerification[] = [
  {
    ticker: "ABBV",
    date: "2026-07-31",
    session: "BMO",
    announcedTime: "8:00 a.m. CT; results before market open",
    sourceUrl: "https://investors.abbvie.com/news-releases/news-release-details/abbvie-host-second-quarter-2026-earnings-conference-call",
    sourceLabel: "AbbVie Investor Relations",
    verifiedAt: "2026-07-31",
  },
  {
    ticker: "AMZN",
    date: "2026-07-30",
    session: "AMC",
    announcedTime: "2:00 p.m. PT / 5:00 p.m. ET",
    sourceUrl: "https://ir.aboutamazon.com/news-release/news-release-details/2026/Amazon-com-to-Webcast-Second-Quarter-2026-Financial-Results-Conference-Call/default.aspx",
    sourceLabel: "Amazon Investor Relations",
    verifiedAt: "2026-07-31",
  },
  {
    ticker: "NVDA",
    date: "2026-08-26",
    session: "AMC",
    announcedTime: "2:00 p.m. PT / 5:00 p.m. ET",
    sourceUrl: "https://investor.nvidia.com/events-and-presentations/events-and-presentations/event-details/2026/NVIDIA-2nd-Quarter-FY27-Financial-Results/default.aspx",
    sourceLabel: "NVIDIA Investor Relations",
    verifiedAt: "2026-07-31",
  },
];

export const officialEarningsVerifications = new Map(
  records.map((record) => [`${record.date}:${record.ticker}`, record]),
);
