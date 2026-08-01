"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type PublicSupabaseConfig = { url: string; publishableKey: string };

let browserClientPromise: Promise<SupabaseClient> | null = null;

export function getSupabaseBrowserClient(): Promise<SupabaseClient> {
  if (!browserClientPromise) {
    browserClientPromise = fetch("/api/auth/config", { cache: "no-store" })
      .then(async (response) => {
        const config = await response.json() as Partial<PublicSupabaseConfig> & { error?: string };
        if (!response.ok || !config.url || !config.publishableKey) {
          throw new Error(config.error ?? "Supabase is not configured.");
        }
        return createClient(config.url, config.publishableKey, {
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
        });
      });
  }
  return browserClientPromise;
}

export async function authenticatedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const supabase = await getSupabaseBrowserClient();
  const { data: { session } } = await supabase.auth.getSession();
  const headers = new Headers(init.headers);
  if (session?.access_token) headers.set("authorization", `Bearer ${session.access_token}`);
  return fetch(input, { ...init, headers });
}

export function loginPath(returnTo = "/account") {
  const safeReturnTo = returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/account";
  return `/login?returnTo=${encodeURIComponent(safeReturnTo)}`;
}
