import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { BrandMark } from "./ui";
import { VisitorTracker } from "./VisitorTracker";
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
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <VisitorTracker />
        {children}
        <footer id="site-footer" className="site-footer">
          <div className="container footer-main">
            <div className="footer-brand">
              <BrandMark />
              <p>Evidence-linked research for investors who want to understand the business behind the ticker.</p>
            </div>
            <nav className="footer-navigation" aria-label="Footer navigation">
              <div>
                <strong>Explore</strong>
                <Link href="/companies">Companies</Link>
                <Link href="/earnings">Earnings calendar</Link>
                <Link href="/emerging-companies">IPOs &amp; private companies</Link>
                <Link href="/interviews">Interviews</Link>
                <Link href="/company/onds">Featured dossier</Link>
              </div>
              <div>
                <strong>Your workspace</strong>
                <Link href="/notebook">Notebook</Link>
                <Link href="/messages">Messages</Link>
                <Link href="/contribute">Contribute research</Link>
                <Link href="/account">Account</Link>
              </div>
            </nav>
          </div>
          <div className="container footer-legal">
            <span>© {new Date().getFullYear()} Learn What You Own. All rights reserved.</span>
            <p>For research and educational purposes only. Not individualized investment advice.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
