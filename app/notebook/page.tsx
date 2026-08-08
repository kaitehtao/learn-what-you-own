import { Header } from "../ui";
import { NotebookClient } from "./NotebookClient";

export default async function NotebookPage({ searchParams }: { searchParams: Promise<{ ticker?: string | string[]; notebookId?: string | string[] }> }) {
  const params = await searchParams;
  const value = params.ticker;
  const initialTicker = (Array.isArray(value) ? value[0] : value)?.toUpperCase().slice(0, 12);
  const notebookValue = Array.isArray(params.notebookId) ? params.notebookId[0] : params.notebookId;
  const initialNotebookId = Number.isInteger(Number(notebookValue)) && Number(notebookValue) > 0 ? Number(notebookValue) : undefined;
  return <main className="notebook-page"><Header /><NotebookClient initialTicker={initialTicker} initialNotebookId={initialNotebookId} /></main>;
}
