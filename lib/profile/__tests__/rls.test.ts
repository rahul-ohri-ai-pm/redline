/**
 * Row-level-security tests against a real Supabase project. They need the
 * migration in supabase/migrations applied and these variables set:
 *   SUPABASE_TEST_URL, SUPABASE_TEST_SERVICE_KEY, SUPABASE_TEST_ANON_KEY
 * Without all three they are skipped, and the skip reason is printed.
 * Use a throwaway project: the tests create and delete two users.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseProfileStore } from "../supabase-store";

const url = process.env.SUPABASE_TEST_URL;
const serviceKey = process.env.SUPABASE_TEST_SERVICE_KEY;
const anonKey = process.env.SUPABASE_TEST_ANON_KEY;
const configured = Boolean(url && serviceKey && anonKey);

if (!configured) {
  console.warn(
    "[rls.test] SKIPPED: set SUPABASE_TEST_URL, SUPABASE_TEST_SERVICE_KEY and SUPABASE_TEST_ANON_KEY to run the real row-level-security tests.",
  );
}

describe.skipIf(!configured)("profiles and red_lines row-level security (real Supabase)", () => {
  const stamp = Date.now();
  const password = `Pw-${stamp}-aA1!`;
  const emails = { a: `rls-a-${stamp}@example.test`, b: `rls-b-${stamp}@example.test` };
  let admin: SupabaseClient;
  let anon: SupabaseClient;
  let a: SupabaseClient;
  let b: SupabaseClient;
  let aId = "";
  let bId = "";
  let bLineId = "";

  async function signedIn(email: string) {
    const client = createClient(url!, anonKey!, { auth: { persistSession: false } });
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return client;
  }

  beforeAll(async () => {
    admin = createClient(url!, serviceKey!, { auth: { persistSession: false } });
    anon = createClient(url!, anonKey!, { auth: { persistSession: false } });
    for (const key of ["a", "b"] as const) {
      const { data, error } = await admin.auth.admin.createUser({
        email: emails[key],
        password,
        email_confirm: true,
      });
      if (error) throw error;
      if (key === "a") aId = data.user.id;
      else bId = data.user.id;
    }
    a = await signedIn(emails.a);
    b = await signedIn(emails.b);
    await createSupabaseProfileStore(a).save(aId, {
      answers: { state: "CA", pets: false },
      redLines: [{ id: crypto.randomUUID(), text: "A's red line" }],
    });
    bLineId = crypto.randomUUID();
    await createSupabaseProfileStore(b).save(bId, {
      answers: { state: "TX" },
      redLines: [{ id: bLineId, text: "B's red line" }],
    });
  });

  afterAll(async () => {
    if (aId) await admin.auth.admin.deleteUser(aId);
    if (bId) await admin.auth.admin.deleteUser(bId);
  });

  it("round-trips not-provided fields through the real table", async () => {
    const saved = await createSupabaseProfileStore(b).load(bId);
    expect(saved?.answers).toEqual({ state: "TX" });
    expect(saved?.redLines.map((l) => l.text)).toEqual(["B's red line"]);
  });

  it("user A cannot select B's rows", async () => {
    const p = await a.from("profiles").select("*").eq("user_id", bId);
    expect(p.error).toBeNull();
    expect(p.data).toEqual([]);
    const r = await a.from("red_lines").select("*").eq("user_id", bId);
    expect(r.data).toEqual([]);
  });

  it("user A cannot update B's rows", async () => {
    const p = await a.from("profiles").update({ state: "NY" }).eq("user_id", bId).select();
    expect(p.data ?? []).toEqual([]);
    const r = await a.from("red_lines").update({ text: "hijacked" }).eq("id", bLineId).select();
    expect(r.data ?? []).toEqual([]);
    const { data } = await admin.from("red_lines").select("text").eq("id", bLineId).single();
    expect(data?.text).toBe("B's red line");
    const prof = await admin.from("profiles").select("state").eq("user_id", bId).single();
    expect(prof.data?.state).toBe("TX");
  });

  it("user A cannot delete B's rows", async () => {
    const r = await a.from("red_lines").delete().eq("id", bLineId).select();
    expect(r.data ?? []).toEqual([]);
    const p = await a.from("profiles").delete().eq("user_id", bId).select();
    expect(p.data ?? []).toEqual([]);
    const lines = await admin.from("red_lines").select("id").eq("id", bLineId);
    expect(lines.data).toHaveLength(1);
    const prof = await admin.from("profiles").select("user_id").eq("user_id", bId);
    expect(prof.data).toHaveLength(1);
  });

  it("user A cannot insert rows owned by B", async () => {
    const p = await a.from("red_lines").insert({
      id: crypto.randomUUID(),
      user_id: bId,
      text: "planted",
      position: 5,
    });
    expect(p.error).not.toBeNull();
    const q = await a.from("profiles").upsert({ user_id: bId, state: "NY" });
    expect(q.error).not.toBeNull();
  });

  it("an unauthenticated request reads nothing", async () => {
    const p = await anon.from("profiles").select("*");
    const r = await anon.from("red_lines").select("*");
    // Either an empty result or a permission error; never any rows.
    expect(p.data ?? []).toEqual([]);
    expect(r.data ?? []).toEqual([]);
  });
});
