import { Header } from "../ui";
import { AnalystWorkspaceClient } from "./AnalystWorkspaceClient";

export default async function AnalystWorkspacePage({ searchParams }: { searchParams: Promise<{ ticker?: string | string[] }> }) {
  const value = (await searchParams).ticker;
  const ticker = (Array.isArray(value) ? value[0] : value)?.trim().toUpperCase().slice(0, 12) ?? "";
  return <main className="analyst-workspace-page"><Header /><AnalystWorkspaceClient initialTicker={ticker} /></main>;
}
