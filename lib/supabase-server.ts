import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SITE_ID, supabaseEnv } from "./supabase";

/** Supabase client acting as the signed-in /admin user (session in cookies). */
export async function adminClient() {
  const env = supabaseEnv();
  const store = await cookies();
  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Called from a server component: the middleware refreshes the session instead.
        }
      },
    },
  });
}

/** The signed-in user, only if they are an admin of this site. */
export async function currentAdmin() {
  const supabase = await adminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, allowed: false };
  const { data } = await supabase.rpc("is_site_admin", { site: SITE_ID });
  return { supabase, user, allowed: data === true };
}
