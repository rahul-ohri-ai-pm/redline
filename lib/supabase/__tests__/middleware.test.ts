import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { updateSession, type SessionClientFactory } from "../middleware";

const env = { url: "https://x.supabase.co", anonKey: "k" };
const req = (path: string) => new NextRequest(new URL(path, "https://app.test"));
const factoryFor =
  (user: { id: string; email?: string } | null, refreshed = false): SessionClientFactory =>
  (_env, cookies) => ({
    auth: {
      getUser: async () => {
        if (refreshed) cookies.setAll([{ name: "sb-token", value: "fresh", options: { path: "/" } }]);
        return { data: { user } };
      },
    },
  });
const neverFactory: SessionClientFactory = () => {
  throw new Error("client must not be created without env");
};

describe("updateSession without Supabase env", () => {
  it("passes every path through, including account pages, without creating a client", async () => {
    for (const p of ["/new", "/library", "/profile/x", "/sign-in"]) {
      const res = await updateSession(req(p), neverFactory, null);
      expect(res.headers.get("location")).toBeNull();
      expect(res.status).toBe(200);
    }
  });
});

describe("updateSession with Supabase env", () => {
  it("redirects a signed-out visit to /library to sign-in with next", async () => {
    const res = await updateSession(req("/library?tab=1"), factoryFor(null), env);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://app.test/sign-in?next=%2Flibrary%3Ftab%3D1");
  });
  it("lets a signed-in visit through", async () => {
    const res = await updateSession(req("/library"), factoryFor({ id: "u", email: "a@b.co" }), env);
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });
  it("does not gate /new for signed-out visitors", async () => {
    const res = await updateSession(req("/new"), factoryFor(null), env);
    expect(res.status).toBe(200);
  });
  it("carries refreshed session cookies on the response and on redirects", async () => {
    const ok = await updateSession(req("/new"), factoryFor({ id: "u" }, true), env);
    expect(ok.cookies.get("sb-token")?.value).toBe("fresh");
    const redirected = await updateSession(req("/profile"), factoryFor(null, true), env);
    expect(redirected.status).toBe(307);
    expect(redirected.cookies.get("sb-token")?.value).toBe("fresh");
  });
  it("treats a failing auth lookup as signed out", async () => {
    const boom: SessionClientFactory = () => ({
      auth: {
        getUser: async () => {
          throw new Error("down");
        },
      },
    });
    expect((await updateSession(req("/library"), boom, env)).status).toBe(307);
    expect((await updateSession(req("/new"), boom, env)).status).toBe(200);
  });
});
