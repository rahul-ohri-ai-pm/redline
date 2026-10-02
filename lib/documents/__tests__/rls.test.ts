/**
 * Row-level-security tests for `documents` against a real Supabase project.
 * They need migrations 0001 and 0002 applied and these variables set:
 *   SUPABASE_TEST_URL, SUPABASE_TEST_SERVICE_KEY, SUPABASE_TEST_ANON_KEY
 * Without all three they are skipped, and the skip reason is printed.
 * Use a throwaway project: the tests create and delete two users.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { DISCLAIMER_TEXT } from "../../analysis/copy";
import { createSupabaseDocumentStore } from "../supabase-store";
import type { NewDocument } from "../types";

const url = process.env.SUPABASE_TEST_URL;
const serviceKey = process.env.SUPABASE_TEST_SERVICE_KEY;
const anonKey = process.env.SUPABASE_TEST_ANON_KEY;
const configured = Boolean(url && serviceKey && anonKey);

if (!configured) {
  console.warn(
    "[documents rls.test] SKIPPED: set SUPABASE_TEST_URL, SUPABASE_TEST_SERVICE_KEY and SUPABASE_TEST_ANON_KEY to run the real row-level-security tests.",
  );
}

const sample = (title: string): NewDocument => ({
  title,
  extractedText: "Rent is due on the first of the month.",
  sections: [
    { id: "page-1", text: "Rent is due on the first of the month.", readable: true },
    { id: "page-2", text: null, readable: false, reason: "Scrambled." },
  ],
  profileSnapshot: { state: "CA", redLines: ["No fees"] },
  report: {
    verdict: "largely-standard",
    riskFlags: [],
    opportunityFlags: [],
    skippedSections: [{ id: "page-2", reason: "Scrambled." }],
    disclaimer: DISCLAIMER_TEXT,
    verdictMessage: "Nothing unusual.",
  },
});

describe.skipIf(!configured)("documents row-level security (real Supabase)", () => {
  const stamp = Date.now();
  const password = `Pw-${stamp}-aA1!`;
  const emails = { a: `doc-a-${stamp}@example.test`, b: `doc-b-${stamp}@example.test` };
  let admin: SupabaseClient;
  let anon: SupabaseClient;
  let a: SupabaseClient;
  let b: SupabaseClient;
  let aId = "";
  let bId = "";
  let bDocId = "";

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
    await createSupabaseDocumentStore(a).insert(aId, sample("A's lease"));
    bDocId = (await createSupabaseDocumentStore(b).insert(bId, sample("B's lease"))).id;
  });

  afterAll(async () => {
    if (aId) await admin.auth.admin.deleteUser(aId);
    if (bId) await admin.auth.admin.deleteUser(bId);
  });

  it("round-trips text, sections, snapshot and report exactly", async () => {
    const loaded = await createSupabaseDocumentStore(b).get(bId, bDocId);
    const { title, ...rest } = sample("B's lease");
    expect(loaded?.title).toBe(title);
    expect({ ...loaded, id: undefined, createdAt: undefined, title: undefined }).toEqual({
      ...rest,
      title: undefined,
      id: undefined,
      createdAt: undefined,
    });
  });

  it("user A cannot select B's documents", async () => {
    const r = await a.from("documents").select("*").eq("id", bDocId);
    expect(r.error).toBeNull();
    expect(r.data).toEqual([]);
    const all = await a.from("documents").select("user_id");
    expect((all.data ?? []).every((row) => row.user_id === aId)).toBe(true);
  });

  it("user A cannot update B's documents", async () => {
    const r = await a.from("documents").update({ title: "hijacked" }).eq("id", bDocId).select();
    expect(r.data ?? []).toEqual([]);
    const { data } = await admin.from("documents").select("title").eq("id", bDocId).single();
    expect(data?.title).toBe("B's lease");
  });

  it("user A cannot delete B's documents", async () => {
    const r = await a.from("documents").delete().eq("id", bDocId).select();
    expect(r.data ?? []).toEqual([]);
    const { data } = await admin.from("documents").select("id").eq("id", bDocId);
    expect(data).toHaveLength(1);
  });

  it("user A cannot insert a document owned by B", async () => {
    const r = await a.from("documents").insert({
      user_id: bId,
      title: "planted",
      extracted_text: "x",
      sections: [],
      profile_snapshot: {},
      report: {},
    });
    expect(r.error).not.toBeNull();
  });

  it("an unauthenticated request reads nothing", async () => {
    const r = await anon.from("documents").select("*");
    expect(r.data ?? []).toEqual([]);
  });
});
