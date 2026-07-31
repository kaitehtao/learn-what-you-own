"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function BrandMark() {
  return <Link className="brand" href="/"><span className="brand-symbol"><i /><i /><i /></span><span>Learn What You Own</span></Link>;
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/account")
      .then((response) => setSignedIn(response.ok))
      .catch(() => setSignedIn(false));
  }, []);

  return (
    <header className="site-header">
      <div className="container nav-inner">
        <BrandMark />
        <nav className={open ? "open" : ""}>
          <Link href="/companies">Companies</Link>
          <Link href="/earnings">Earnings</Link>
          <Link href="/company/onds">Research</Link>
          <Link href="/interviews">Interviews</Link>
          <Link href="/contribute">Contribute</Link>
          {signedIn && <Link href="/portfolio">Portfolio</Link>}
        </nav>
        <div className="nav-actions"><button className="search-button" aria-label="Search">⌕</button>{signedIn && <Link href="/watchlist">Watchlist</Link>}{signedIn === false ? <a className="nav-cta" href="/signin-with-chatgpt?return_to=%2Faccount">Sign in</a> : <Link className="nav-cta" href="/account">{signedIn ? "My account" : "Account"}</Link>}</div>
        <button className="menu-button" aria-label="Toggle menu" onClick={() => setOpen(!open)}>☰</button>
      </div>
    </header>
  );
}
