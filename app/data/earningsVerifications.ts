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
  {
    ticker: "SPCX",
    date: "2026-08-04",
    session: "AMC",
    announcedTime: "3:30 p.m. CT / 4:30 p.m. ET; results after market close",
    sourceUrl: "https://ir.spacex.com/updates/releases-details/2026/SpaceX-to-Post-Second-Quarter-2026-Results-and-Host-Webcast-on-August-4-2026-2026-g8layJlbFm/default.aspx",
    sourceLabel: "SpaceX Investor Relations",
    verifiedAt: "2026-08-01",
  },
];

export const officialEarningsVerifications = new Map(
  records.map((record) => [`${record.date}:${record.ticker}`, record]),
);
