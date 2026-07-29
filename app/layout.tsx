import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Learn What You Own — Research for Owners",
  description: "Living, evidence-linked owner’s manuals for the businesses you own.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "Learn What You Own",
    description: "Know the business. Own with conviction.",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Learn What You Own" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Learn What You Own",
    description: "Know the business. Own with conviction.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body></html>;
}
