import Link from "next/link";
import { Header } from "../ui";
import { AdminDashboard } from "./AdminDashboard";
import { BrokerageAnalytics } from "./BrokerageAnalytics";
import { ModerationClient } from "./ModerationClient";
import { FreshnessQueue } from "./FreshnessQueue";

export default function AdminPage() {
  return <main><Header/><section className="admin-shell"><aside className="admin-nav"><span className="kicker">ADMINISTRATOR</span><strong>Learn What You Own</strong><a href="#overview">Overview</a><a href="#freshness">Filing freshness</a><a href="#brokerage-referrals">Brokerage referrals</a><a href="#accounts">Accounts</a><a href="#moderation">Review queue</a><a href="#audit">Audit log</a><Link href="/companies">Companies</Link><Link href="/account">← Member account</Link></aside><div className="admin-content"><AdminDashboard/><FreshnessQueue/><BrokerageAnalytics/><div id="moderation"><ModerationClient/></div></div></section></main>;
}
