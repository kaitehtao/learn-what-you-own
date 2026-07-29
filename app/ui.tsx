"use client";

import Link from "next/link";
import { useState } from "react";

export function BrandMark() {
  return <Link className="brand" href="/"><span className="brand-symbol"><i /><i /><i /></span><span>Learn What You Own</span></Link>;
}

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="container nav-inner">
        <BrandMark />
        <nav className={open ? "open" : ""}>
          <Link href="/companies">Companies</Link>
          <Link href="/company/onds">Research</Link>
          <Link href="/interviews">Interviews</Link>
          <Link href="/contribute">Contribute</Link>
          <Link href="/admin">Editor</Link>
        </nav>
        <div className="nav-actions"><button className="search-button" aria-label="Search">⌕</button><Link href="/watchlist">My watchlist</Link><Link className="nav-cta" href="/company/onds">Start researching</Link></div>
        <button className="menu-button" aria-label="Toggle menu" onClick={() => setOpen(!open)}>☰</button>
      </div>
    </header>
  );
}
