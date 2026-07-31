import Link from "next/link";
import { Header } from "../ui";
import { ModerationClient } from "./ModerationClient";

export default function AdminPage() {
  return <main><Header/><section className="admin-shell"><aside className="admin-nav"><span className="kicker">EDITORIAL DESK</span><strong>Learn What You Own</strong>{["Review queue","Companies","Documents","Claims","Research reports","Interviews","Corrections","Users"].map((x,i)=><button className={i===0?"active":""} key={x}>{x}</button>)}<Link href="/account">← Member account</Link></aside><ModerationClient/></section></main>;
}
