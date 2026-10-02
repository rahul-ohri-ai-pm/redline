import { describe, expect, it } from "vitest";
import {
  decideAccess,
  isProtectedPath,
  isValidEmail,
  resolveCallback,
  resolveRequireUser,
  safeNext,
  sendMagicLink,
} from "../auth";
import { readSupabaseEnv } from "../env";

const user = { id: "u1", email: "a@b.co" };

describe("email validation", () => {
  it("accepts ordinary addresses and trims", () => {
    expect(isValidEmail("renter@example.com")).toBe(true);
    expect(isValidEmail("  renter@mail.example.co.uk ")).toBe(true);
  });
  it("rejects malformed ones", () => {
    for (const bad of [
      "",
      "renter",
      "renter@",
      "@example.com",
      "a b@example.com",
      "a@example",
      "a@@example.com",
      "a@.com",
    ]) {
      expect(isValidEmail(bad)).toBe(false);
    }
  });
});

describe("protected paths and access decision", () => {
  it("covers account, library and profile prefixes only", () => {
    expect(isProtectedPath("/library")).toBe(true);
    expect(isProtectedPath("/library/abc")).toBe(true);
    expect(isProtectedPath("/profile")).toBe(true);
    expect(isProtectedPath("/account/settings")).toBe(true);
    expect(isProtectedPath("/libraryx")).toBe(false);
    expect(isProtectedPath("/new")).toBe(false);
    expect(isProtectedPath("/sign-in")).toBe(false);
  });
  it("redirects signed-out visitors to sign-in with the way back", () => {
    expect(decideAccess({ pathname: "/library/abc", search: "?x=1", user: null })).toEqual({
      action: "redirect",
      to: "/sign-in?next=%2Flibrary%2Fabc%3Fx%3D1",
    });
  });
  it("lets signed-in visitors through and never gates /new", () => {
    expect(decideAccess({ pathname: "/library", user })).toEqual({ action: "allow" });
    expect(decideAccess({ pathname: "/new", user: null })).toEqual({ action: "allow" });
  });
});

describe("safeNext", () => {
  it("blocks off-site and malformed destinations", () => {
    expect(safeNext("https://evil.example")).toBe("/new");
    expect(safeNext("//evil.example")).toBe("/new");
    expect(safeNext("/\\evil")).toBe("/new");
    expect(safeNext(null)).toBe("/new");
    expect(safeNext("/library")).toBe("/library");
  });
});

describe("sendMagicLink", () => {
  it("sends to the callback with a safe next and returns the trimmed email", async () => {
    const calls: unknown[] = [];
    const client = {
      auth: {
        signInWithOtp: async (a: unknown) => {
          calls.push(a);
          return { error: null };
        },
      },
    };
    const r = await sendMagicLink(client, " me@example.com ", "https://app.test", "https://evil.example");
    expect(r).toEqual({ ok: true, email: "me@example.com" });
    expect(calls).toEqual([
      {
        email: "me@example.com",
        options: { emailRedirectTo: "https://app.test/auth/callback?next=%2Fnew" },
      },
    ]);
  });
  it("does not call the client for an invalid email", async () => {
    let called = false;
    const client = {
      auth: {
        signInWithOtp: async () => {
          called = true;
          return { error: null };
        },
      },
    };
    expect(await sendMagicLink(client, "nope", "https://app.test")).toEqual({
      ok: false,
      reason: "invalid_email",
    });
    expect(called).toBe(false);
  });
  it("reports provider errors, thrown or returned", async () => {
    const returned = { auth: { signInWithOtp: async () => ({ error: { message: "rate limit" } }) } };
    const thrown = {
      auth: {
        signInWithOtp: async () => {
          throw new Error("network");
        },
      },
    };
    expect(await sendMagicLink(returned, "a@b.co", "https://x")).toEqual({ ok: false, reason: "send_failed" });
    expect(await sendMagicLink(thrown, "a@b.co", "https://x")).toEqual({ ok: false, reason: "send_failed" });
  });
  it("reports not configured when there is no client", async () => {
    expect(await sendMagicLink(null, "a@b.co", "https://x")).toEqual({
      ok: false,
      reason: "not_configured",
    });
  });
});

describe("resolveCallback", () => {
  const okClient = { auth: { exchangeCodeForSession: async () => ({ error: null }) } };
  it("sends a successful exchange to the next page", async () => {
    expect(await resolveCallback(okClient, "c", "/library")).toEqual({ redirectTo: "/library" });
    expect(await resolveCallback(okClient, "c", "//evil.example")).toEqual({ redirectTo: "/new" });
  });
  it("sends a failed or thrown exchange back to sign-in with the link error", async () => {
    const bad = { auth: { exchangeCodeForSession: async () => ({ error: { message: "expired" } }) } };
    const boom = {
      auth: {
        exchangeCodeForSession: async () => {
          throw new Error("x");
        },
      },
    };
    expect((await resolveCallback(bad, "c", null)).redirectTo).toBe("/sign-in?error=link");
    expect((await resolveCallback(boom, "c", "/library")).redirectTo).toBe(
      "/sign-in?next=%2Flibrary&error=link",
    );
  });
  it("treats a missing code as a bad link and a missing client as plain sign-in", async () => {
    expect((await resolveCallback(okClient, null, null)).redirectTo).toBe("/sign-in?error=link");
    expect((await resolveCallback(null, "c", "/library")).redirectTo).toBe("/sign-in");
  });
});

describe("resolveRequireUser", () => {
  const redirect = (to: string): never => {
    throw new Error("REDIRECT " + to);
  };
  it("returns the user when signed in", async () => {
    expect(await resolveRequireUser({ getUser: async () => user, redirect }, "/library")).toEqual(user);
  });
  it("redirects to sign-in when signed out", async () => {
    await expect(
      resolveRequireUser({ getUser: async () => null, redirect }, "/library"),
    ).rejects.toThrow("REDIRECT /sign-in?next=%2Flibrary");
  });
});

describe("readSupabaseEnv", () => {
  it("is null when either value is missing or blank", () => {
    expect(readSupabaseEnv({})).toBeNull();
    expect(readSupabaseEnv({ url: "https://x.supabase.co" })).toBeNull();
    expect(readSupabaseEnv({ url: "  ", anonKey: "k" })).toBeNull();
  });
  it("returns both when set", () => {
    expect(readSupabaseEnv({ url: "https://x.supabase.co", anonKey: "k" })).toEqual({
      url: "https://x.supabase.co",
      anonKey: "k",
    });
  });
  it("reads process.env at call time, not import time", () => {
    const u = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const k = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    try {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      expect(readSupabaseEnv()).toBeNull();
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://late.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "late";
      expect(readSupabaseEnv()).toEqual({ url: "https://late.supabase.co", anonKey: "late" });
    } finally {
      if (u === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      else process.env.NEXT_PUBLIC_SUPABASE_URL = u;
      if (k === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = k;
    }
  });
});
