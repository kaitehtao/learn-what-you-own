"use client";

import Link from "next/link";
import { useEffect, useState, type MouseEvent } from "react";
import { getSupabaseBrowserClient } from "./supabase-browser";
import { NotificationBell } from "./NotificationBell";

export function BrandMark() {
  return (
    <Link className="brand" href="/" aria-label="Learn What You Own home">
      <span className="brand-symbol" aria-hidden="true"><i /><i /><i /></span>
      <span className="brand-copy">
        <span className="brand-name">Learn What You Own</span>
        <span className="brand-tagline">Evidence-led investment research</span>
      </span>
    </Link>
  );
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

  const focusHomepageSearch = (event: MouseEvent<HTMLAnchorElement>) => {
    if (window.location.pathname !== "/") return;
    event.preventDefault();
    window.history.replaceState(null, "", "#company-search");
    const input = document.getElementById("company-search-input") as HTMLInputElement | null;
    input?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.requestAnimationFrame(() => input?.focus({ preventScroll: true }));
  };

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
          <Link href="/learn">Learn</Link>
          <Link href="/otc">OTC</Link>
          <Link href="/earnings">Earnings</Link>
          <Link href="/insider-activity">Insider Activity</Link>
          <Link href="/comps">Comps</Link>
          <details className="workspace-menu research-menu">
            <summary>Research</summary>
            <div>
              <Link href="/research/sp-500">S&amp;P 500 dossiers</Link>
              <Link href="/research/russell-2000">Russell 2000 dossiers</Link>
              <Link href="/research/batches">Coverage program</Link>
            </div>
          </details>
          <details className="workspace-menu community-menu">
            <summary>Community</summary>
            <div>
              <Link href="/research/community">Published research</Link>
              <Link href="/conversations">Conversations</Link>
              <Link href="/contributors">Contributors</Link>
              <Link href="/community-guidelines">Community guidelines</Link>
            </div>
          </details>
          <Link href="/interviews">Interviews</Link>
          <Link href="/founders-letter">Founder’s Letter</Link>
          <Link href="/contribute">Contribute</Link>
          <Link href="/feedback">Feedback</Link>
          {signedIn && (
            <details className="workspace-menu">
              <summary>Workspace</summary>
              <div>
                <Link href="/workspace">Analyst workspace</Link>
                <Link href="/portfolio">Portfolio</Link>
                <Link href="/notebook">Notebook</Link>
                <Link href="/watchlist">Watchlist</Link>
                <Link href="/messages">Messages</Link>
                <Link href="/notifications">Notifications</Link>
                <Link href="/account/safety">Safety</Link>
              </div>
            </details>
          )}
          {signedIn && <div className="mobile-workspace-links">
            <span>Your workspace</span>
            <Link href="/workspace">Analyst</Link>
            <Link href="/portfolio">Portfolio</Link>
            <Link href="/notebook">Notebook</Link>
            <Link href="/watchlist">Watchlist</Link>
            <Link href="/messages">Messages</Link>
            <Link href="/notifications">Notifications</Link>
            <Link href="/account/safety">Safety</Link>
          </div>}
          <div className="mobile-nav-actions">
            <Link href="/#company-search" onClick={focusHomepageSearch}>Search companies</Link>
            {signedIn && <Link href="/watchlist">Watchlist</Link>}
            {signedIn === false
              ? <><Link href="/login">Member sign in</Link><Link className="nav-cta" href="/login?mode=signup">Join free</Link></>
              : <Link className="nav-cta" href="/account">{signedIn ? "My account" : "Account"}</Link>}
          </div>
        </nav>
        <div className="nav-actions">
          <Link className="search-shortcut" href="/#company-search" onClick={focusHomepageSearch} aria-label="Jump to company search"><span aria-hidden="true">⌕</span><strong>Search</strong></Link>
          <NotificationBell signedIn={signedIn}/>
          {signedIn
            ? <Link className="nav-cta" href="/account">My account</Link>
            : <><Link className="nav-signin" href="/login">Member sign in</Link><Link className="nav-cta" href="/login?mode=signup">Create free account</Link></>}
        </div>
        <button
          className="menu-button"
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-controls="primary-navigation"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        ><span className="menu-icon" aria-hidden="true">{open ? "×" : "☰"}</span><span className="menu-label">{open ? "Close" : "Menu"}</span></button>
      </div>
    </header>
  );
}
