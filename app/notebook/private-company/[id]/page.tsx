import type { Metadata } from "next";
import { Header } from "../../../ui";
import { PrivateCompanyNotebookClient } from "./PrivateCompanyNotebookClient";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function PrivateCompanyNotebookPage({ params }: { params: Promise<{ id: string }> }) {
  const notebookId = Number((await params).id);
  return <main className="private-company-notebook-page"><Header /><PrivateCompanyNotebookClient notebookId={notebookId} /></main>;
}
