"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "./supabase-browser";

export function BrandMark() {
  return <Link className="brand" href="/"><span className="brand-symbol"><i /><i /><i /></span><span>Learn What You Own</span></Link>;
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};
    getSupabaseBrowserClient().then(async supabase => {
      const { data: { session } } = await supabase.auth.getSession();
      if (active) setSignedIn(Boolean(session));
      const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => active && setSignedIn(Boolean(nextSession)));
      unsubscribe = () => data.subscription.unsubscribe();
    }).catch(() => active && setSignedIn(false));
    return () => { active = false; unsubscribe(); };
  }, []);

  return (
    <header className="site-header">
      <div className="container nav-inner">
        <BrandMark />
        <nav
          id="primary-navigation"
          className={open ? "open" : ""}
          aria-label="Primary navigation"
          onClick={event => {
            if ((event.target as HTMLElement).closest("a")) setOpen(false);
          }}
        >
          <Link href="/companies">Companies</Link>
          <Link href="/earnings">Earnings</Link>
          <Link href="/company/onds">Research</Link>
          <Link href="/interviews">Interviews</Link>
          <Link href="/contribute">Contribute</Link>
          {signedIn && <Link href="/portfolio">Portfolio</Link>}
          <div className="mobile-nav-actions">
            {signedIn && <Link href="/watchlist">Watchlist</Link>}
            {signedIn === false
              ? <Link className="nav-cta" href="/login">Sign in</Link>
              : <Link className="nav-cta" href="/account">{signedIn ? "My account" : "Account"}</Link>}
          </div>
        </nav>
        <div className="nav-actions"><button className="search-button" aria-label="Search">⌕</button>{signedIn && <Link href="/watchlist">Watchlist</Link>}{signedIn === false ? <Link className="nav-cta" href="/login">Sign in</Link> : <Link className="nav-cta" href="/account">{signedIn ? "My account" : "Account"}</Link>}</div>
        <button
          className="menu-button"
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-controls="primary-navigation"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >{open ? "×" : "☰"}</button>
      </div>
    </header>
  );
}
