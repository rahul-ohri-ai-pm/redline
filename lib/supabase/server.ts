import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { readSupabaseEnv } from "./env";
import { resolveRequireUser, type AuthUser } from "./auth";

/** Server client bound to the request cookies. Null when not configured. */
export async function createServerSupabase() {
  const env = readSupabaseEnv();
  if (!env) return null;
  const store = await cookies();
  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // The middleware refreshes the session, so this is safe to skip.
        }
      },
    },
  });
}

/** The signed-in user, or null (also null when Supabase isn't configured). */
export async function getServerUser(): Promise<AuthUser | null> {
  const client = await createServerSupabase();
  if (!client) return null;
  const { data } = await client.auth.getUser();
  return data.user ? { id: data.user.id, email: data.user.email ?? null } : null;
}

/**
 * For pages that need an account (library, red lines). Redirects to
 * sign-in when signed out or when sign-in isn't set up, otherwise returns
 * the user.
 */
export async function requireUser(next?: string): Promise<AuthUser> {
  return resolveRequireUser({ getUser: getServerUser, redirect }, next);
}
