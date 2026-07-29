import Link from "next/link";
import { canModerate, requireMemberProfile } from "../member";
import { Header } from "../ui";
import { ModerationClient } from "./ModerationClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const profile = await requireMemberProfile("/admin");
  if (!canModerate(profile)) {
    return <main><Header/><section className="simple-page"><div className="container"><span className="kicker">EDITORIAL DESK</span><h1>Editor access required.</h1><p>Your account can submit research and track its review status, but only approved editors can moderate community contributions.</p><Link className="button dark-button" href="/contribute">View my contributions</Link></div></section></main>;
  }
  return <main><Header/><section className="admin-shell"><aside className="admin-nav"><span className="kicker">EDITORIAL DESK</span><strong>Learn What You Own</strong>{["Review queue","Companies","Documents","Claims","Research reports","Interviews","Corrections","Users"].map((x,i)=><button className={i===0?"active":""} key={x}>{x}</button>)}<Link href="/account">← Member account</Link></aside><ModerationClient/></section></main>;
}
