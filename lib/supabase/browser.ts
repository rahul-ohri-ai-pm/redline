import { createBrowserClient } from "@supabase/ssr";
import { readSupabaseEnv } from "./env";

/** Browser client. Returns null when Supabase isn't configured. */
export function createBrowserSupabase() {
  const env = readSupabaseEnv();
  if (!env) return null;
  return createBrowserClient(env.url, env.anonKey);
}
