/**
 * Supabase settings, read at call time only. Importing this module (or
 * anything that imports it) never throws when the variables are unset, so
 * the app builds and starts without a Supabase project.
 *
 * The two NEXT_PUBLIC_ names are written out literally below because Next
 * only inlines them into browser bundles when it can see the full name.
 */
export interface SupabaseEnv {
  url: string;
  anonKey: string;
}

export function readSupabaseEnv(
  source: { url?: string; anonKey?: string } = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
): SupabaseEnv | null {
  const url = source.url?.trim();
  const anonKey = source.anonKey?.trim();
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  return readSupabaseEnv() !== null;
}
