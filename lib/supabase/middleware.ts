import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { readSupabaseEnv, type SupabaseEnv } from "./env";
import { decideAccess, type AuthUser } from "./auth";

type CookieList = { name: string; value: string; options?: Record<string, unknown> }[];

export interface SessionClient {
  auth: { getUser(): Promise<{ data: { user: { id: string; email?: string } | null } }> };
}

export type SessionClientFactory = (
  env: SupabaseEnv,
  cookies: { getAll: () => { name: string; value: string }[]; setAll: (list: CookieList) => void },
) => SessionClient;

const defaultFactory: SessionClientFactory = (env, cookies) =>
  createServerClient(env.url, env.anonKey, { cookies }) as unknown as SessionClient;

/**
 * Refreshes the session cookie on every request and redirects signed-out
 * visitors away from account pages. With no Supabase settings it does
 * nothing at all.
 */
export async function updateSession(
  request: NextRequest,
  factory: SessionClientFactory = defaultFactory,
  env: SupabaseEnv | null = readSupabaseEnv(),
): Promise<NextResponse> {
  if (!env) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const client = factory(env, {
    getAll: () => request.cookies.getAll(),
    setAll: (list) => {
      for (const { name, value } of list) request.cookies.set(name, value);
      response = NextResponse.next({ request });
      for (const { name, value, options } of list) {
        response.cookies.set(name, value, options);
      }
    },
  });

  let user: AuthUser | null = null;
  try {
    const { data } = await client.auth.getUser();
    if (data.user) user = { id: data.user.id, email: data.user.email ?? null };
  } catch {
    user = null;
  }

  const decision = decideAccess({
    pathname: request.nextUrl.pathname,
    search: request.nextUrl.search,
    user,
  });
  if (decision.action === "redirect") {
    const redirect = NextResponse.redirect(new URL(decision.to, request.url));
    for (const c of response.cookies.getAll()) redirect.cookies.set(c);
    return redirect;
  }
  return response;
}
