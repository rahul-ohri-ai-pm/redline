/**
 * Auth decisions that don't depend on Next or a live Supabase project, so
 * they can be tested with an injected client.
 */

export interface AuthUser {
  id: string;
  email: string | null;
}

/** Path prefixes that need an account. */
export const PROTECTED_PREFIXES = ["/account", "/library", "/profile"] as const;

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

export function isValidEmail(value: string): boolean {
  const v = value.trim();
  return v.length <= 254 && EMAIL_PATTERN.test(v);
}

/** Only same-site paths are allowed as a post-sign-in destination. */
export function safeNext(next: string | null | undefined, fallback = "/new"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return fallback;
  }
  return next;
}

export function signInPath(next?: string | null, error?: string): string {
  const params = new URLSearchParams();
  if (next && safeNext(next, "") !== "") params.set("next", next);
  if (error) params.set("error", error);
  const qs = params.toString();
  return qs ? `/sign-in?${qs}` : "/sign-in";
}

export type AccessDecision = { action: "allow" } | { action: "redirect"; to: string };

/** Signed-out visitors to account pages go to sign-in. */
export function decideAccess(input: {
  pathname: string;
  search?: string;
  user: AuthUser | null;
}): AccessDecision {
  if (!isProtectedPath(input.pathname)) return { action: "allow" };
  if (input.user) return { action: "allow" };
  return { action: "redirect", to: signInPath(input.pathname + (input.search ?? "")) };
}

export interface MagicLinkClient {
  auth: {
    signInWithOtp(args: {
      email: string;
      options: { emailRedirectTo: string };
    }): Promise<{ error: { message: string } | null }>;
  };
}

export type MagicLinkResult =
  | { ok: true; email: string }
  | { ok: false; reason: "not_configured" | "invalid_email" | "send_failed" };

export async function sendMagicLink(
  client: MagicLinkClient | null,
  email: string,
  origin: string,
  next?: string | null,
): Promise<MagicLinkResult> {
  if (!client) return { ok: false, reason: "not_configured" };
  if (!isValidEmail(email)) return { ok: false, reason: "invalid_email" };
  const clean = email.trim();
  const redirect = `${origin}/auth/callback?next=${encodeURIComponent(safeNext(next))}`;
  try {
    const { error } = await client.auth.signInWithOtp({
      email: clean,
      options: { emailRedirectTo: redirect },
    });
    return error ? { ok: false, reason: "send_failed" } : { ok: true, email: clean };
  } catch {
    return { ok: false, reason: "send_failed" };
  }
}

export interface CodeExchangeClient {
  auth: {
    exchangeCodeForSession(code: string): Promise<{ error: { message: string } | null }>;
  };
}

/** Where the callback route should send the browser. */
export async function resolveCallback(
  client: CodeExchangeClient | null,
  code: string | null,
  next: string | null,
): Promise<{ redirectTo: string }> {
  if (!client) return { redirectTo: signInPath(null) };
  if (!code) return { redirectTo: signInPath(next, "link") };
  try {
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (error) return { redirectTo: signInPath(next, "link") };
  } catch {
    return { redirectTo: signInPath(next, "link") };
  }
  return { redirectTo: safeNext(next) };
}

export async function resolveRequireUser(
  deps: { getUser: () => Promise<AuthUser | null>; redirect: (to: string) => never },
  next?: string,
): Promise<AuthUser> {
  const user = await deps.getUser();
  if (!user) deps.redirect(signInPath(next));
  return user as AuthUser;
}
