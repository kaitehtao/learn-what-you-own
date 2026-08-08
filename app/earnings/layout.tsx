import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Earnings Calendar, Estimates and Models | Learn What You Own",
  description: "Track earnings dates, consensus and crowd estimates, surprises, and collaborative evidence-linked earnings models.",
  alternates: { canonical: "https://learnwhatyouown.com/earnings" },
};

export default function EarningsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
