import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Management and Investor Interviews | Learn What You Own",
  description: "Evidence-linked interviews with company management, professional investors, analysts, operators, and industry experts.",
  alternates: { canonical: "https://learnwhatyouown.com/interviews" },
};

export default function InterviewsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
