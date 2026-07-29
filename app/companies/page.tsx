import Link from "next/link";
import { Header } from "../ui";

const rows = [
  ["ONDS","Ondas Holdings","Autonomous Systems","82%","Today"],
  ["NVDA","NVIDIA","Semiconductors","96%","Today"],
  ["BB","BlackBerry","Infrastructure Software","91%","Yesterday"],
  ["BE","Bloom Energy","Clean Energy","88%","Yesterday"],
  ["RKLB","Rocket Lab","Space Systems","93%","2 days ago"],
  ["PLTR","Palantir","Enterprise AI","95%","3 days ago"],
];

export default function Companies() {
  return <main><Header /><section className="directory-hero"><div className="container"><span className="kicker">COMPANY LIBRARY</span><h1>One living dossier.<br />Everything worth knowing.</h1><p>Explore businesses through verified claims, balanced debate, and a permanent record of what changed.</p><div className="directory-search">⌕ <input placeholder="Search companies and tickers" /></div></div></section><section className="container directory-section"><div className="filter-row"><strong>46 companies</strong><div><button>All sectors⌄</button><button>All completeness⌄</button><button>Recently updated⌄</button></div></div><div className="directory-table"><div className="directory-row directory-labels"><span>COMPANY</span><span>SECTOR</span><span>COMPLETENESS</span><span>UPDATED</span><span /></div>{rows.map(row => <Link href={row[0] === "ONDS" ? "/company/onds" : "#"} className="directory-row" key={row[0]}><span className="company-cell"><i>{row[0].slice(0,2)}</i><span><strong>{row[1]}</strong><small>{row[0]}</small></span></span><span>{row[2]}</span><span className="completion-cell"><i><b style={{width: row[3]}} /></i>{row[3]}</span><span>{row[4]}</span><span>→</span></Link>)}</div></section></main>;
}
