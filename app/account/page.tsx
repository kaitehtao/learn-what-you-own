import { Header } from "../ui";
import { AccountClient } from "./AccountClient";

export default function AccountPage() {
  return <main><Header/><section className="account-hero"><div className="container"><span className="kicker">MEMBER ACCOUNT</span><h1>Your research identity.</h1><p>Saved companies, private portfolio context, and attributed community insights—connected to one verified account.</p></div></section><AccountClient/></main>;
}
