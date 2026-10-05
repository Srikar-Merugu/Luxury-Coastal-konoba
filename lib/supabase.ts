import { createClient } from "@supabase/supabase-js";

/** Rows in the shared Supabase project are scoped to this site. */
export const SITE_ID = "konoba";

/** Cache tag for every public read; /admin revalidates it after a change. */
export const CONTENT_TAG = "konoba-content";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anonKey);

export function supabaseEnv() {
  if (!url || !anonKey) throw new Error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set");
  return { url, anonKey };
}

/**
 * Anonymous client for public reads and the booking insert. Reads are cached
 * for a minute and tagged, so edits made in Supabase show up without a
 * redeploy, and edits made in /admin show up at once.
 */
export function publicClient() {
  const env = supabaseEnv();
  return createClient(env.url, env.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, next: { revalidate: 60, tags: [CONTENT_TAG] } } as RequestInit),
    },
  });
}

/** Anonymous client with no caching, for writes (the booking insert). */
export function writeClient() {
  const env = supabaseEnv();
  return createClient(env.url, env.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
}
