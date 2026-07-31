"use client";

import { useEffect, useState } from "react";
import { authenticatedFetch, getSupabaseBrowserClient } from "../../supabase-browser";

export default function AuthCallbackPage() {
  const [message, setMessage] = useState("Verifying your account…");
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const supabase = await getSupabaseBrowserClient();
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        let { data: { session } } = await supabase.auth.getSession();
        if (!session && code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          ({ data: { session } } = await supabase.auth.getSession());
        }
        if (!session) throw new Error("The verification link is invalid or expired.");
        const accountResponse = await authenticatedFetch("/api/account");
        if (!accountResponse.ok) throw new Error("Your account was verified, but its profile could not be loaded.");
        const account = await accountResponse.json() as { profile: { onboarding_complete: boolean } };
        const requested = params.get("returnTo") ?? "/account";
        const returnTo = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/account";
        window.location.replace(account.profile.onboarding_complete ? returnTo : `/onboarding?returnTo=${encodeURIComponent(returnTo)}`);
      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : "Unable to verify your account.");
      }
    })();
    return () => { active = false; };
  }, []);
  return <main className="auth-callback"><div><span className="brand-symbol"><i/><i/><i/></span><h1>{message}</h1><p>You can close this page if it does not continue automatically.</p></div></main>;
}
