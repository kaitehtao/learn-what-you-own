import type { Metadata } from "next";
import { Header } from "../../ui";
import { ResearchCommunityClient } from "./ResearchCommunityClient";

export const metadata: Metadata = { title: "Community Research | Learn What You Own", description: "Long-form, source-linked investment research from the Learn What You Own community." };

export default async function ResearchCommunityPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const first = (key: string) => Array.isArray(params[key]) ? params[key]?.[0] ?? "" : params[key] ?? "";
  return <main className="research-community-page"><Header /><ResearchCommunityClient initialId={first("id")} initialTicker={first("ticker")} initialAuthor={first("author")} sourceNoteId={first("sourceNote")} composeInitially={first("compose") === "1"} /></main>;
}
