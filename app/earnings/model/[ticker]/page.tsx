import type { Metadata } from "next";
import { Header } from "../../../ui";
import { CollaborativeEarningsModel } from "./CollaborativeEarningsModel";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function generateMetadata({ params }: { params: Promise<{ ticker: string }> }): Promise<Metadata> {
  const ticker = (await params).ticker.trim().toUpperCase().replace(/[^A-Z0-9.-]/g, "").slice(0, 12);
  return {
    title: `${ticker} Collaborative Earnings Model | Learn What You Own`,
    description: `Build a private ${ticker} earnings model and compare anonymous community estimates with source-linked assumptions.`,
    alternates: { canonical: `https://learnwhatyouown.com/earnings/model/${ticker.toLowerCase().replaceAll(".", "-")}` },
    robots: { index: false, follow: true },
  };
}

export default async function CollaborativeEarningsModelPage({
  params,
  searchParams,
}: {
  params: Promise<{ ticker: string }>;
  searchParams: Promise<{ date?: string | string[]; quarter?: string | string[]; company?: string | string[] }>;
}) {
  const ticker = (await params).ticker.trim().toUpperCase().replace(/[^A-Z0-9.-]/g, "").slice(0, 12);
  const query = await searchParams;
  const dateValue = Array.isArray(query.date) ? query.date[0] : query.date;
  const reportDate = dateValue && DATE_PATTERN.test(dateValue) ? dateValue : new Date().toISOString().slice(0, 10);
  const quarterValue = Array.isArray(query.quarter) ? query.quarter[0] : query.quarter;
  const companyValue = Array.isArray(query.company) ? query.company[0] : query.company;
  return <main className="earnings-model-page">
    <Header />
    <CollaborativeEarningsModel
      ticker={ticker}
      reportDate={reportDate}
      fiscalQuarter={(quarterValue ?? "").trim().slice(0, 40)}
      companyName={(companyValue ?? `${ticker} company`).trim().slice(0, 160)}
    />
  </main>;
}
