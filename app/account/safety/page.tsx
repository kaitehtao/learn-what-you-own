import type { Metadata } from "next";
import { Header } from "../../ui";
import { SafetyControlsClient } from "./SafetyControlsClient";

export const metadata: Metadata = { title: "Safety & Reports | Learn What You Own" };
export default function SafetyPage() { return <main><Header /><SafetyControlsClient /></main>; }
