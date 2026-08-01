import { Header } from "../ui";
import { NotebookClient } from "./NotebookClient";

export default async function NotebookPage({ searchParams }: { searchParams: Promise<{ ticker?: string | string[] }> }) {
  const value = (await searchParams).ticker;
  const initialTicker = (Array.isArray(value) ? value[0] : value)?.toUpperCase().slice(0, 12);
  return <main className="notebook-page"><Header /><NotebookClient initialTicker={initialTicker} /></main>;
}
