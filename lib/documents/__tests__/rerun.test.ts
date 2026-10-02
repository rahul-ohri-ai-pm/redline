import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { analyzeDocument } from "../../analysis-engine";
import { verifyCitation } from "../../analysis/citation";
import type { FetchLike } from "../../openrouter";
import { parseFile } from "../../parse";
import { loadReport } from "../../library/load";
import { createMemoryProfileStore } from "../../profile/memory-store";
import { handleAnalyzeRequest, type AnalyzeHandlerDeps } from "../analyze-handler";
import { parseRerunTarget, requestRerun, type AnalyzeFetch } from "../client";
import { createMemoryDocumentStore } from "../memory-store";

const FIXTURES = path.resolve(process.cwd(), "tests/fixtures");
const raw = readFileSync(path.join(FIXTURES, "adhesion-lease.txt"), "utf-8");
const sidecar = JSON.parse(
  readFileSync(path.join(FIXTURES, "adhesion-lease.sidecar.json"), "utf-8"),
) as { clauses: { clauseType: string; sourceSentence: string; expectedSeverity: string }[] };

function flagsFor(clauses: typeof sidecar.clauses) {
  return clauses.map((c) => ({
    clauseType: c.clauseType,
    sourceSentence: c.sourceSentence,
    label: `does something related to ${c.clauseType}`,
    confidence: "high",
    oneSidedness: c.expectedSeverity === "high" ? "high" : "medium",
    dollarAmount: 500,
    noticeHours: null,
    noticeDays: c.clauseType === "auto-renewal" ? 90 : null,
  }));
}

function stub(payload: unknown, seen: string[] = [], fail = false): FetchLike {
  return async (_url, init) => {
    seen.push(String((init as { body?: string })?.body ?? ""));
    if (fail) throw new Error("model down");
    const content = JSON.stringify(payload);
    return {
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: "stop" }],
      }),
      text: async () => content,
    } as never;
  };
}

async function setup() {
  const parsed = await parseFile({
    name: "adhesion-lease.txt",
    type: "text/plain",
    arrayBuffer: async () => new TextEncoder().encode(raw).buffer as ArrayBuffer,
  });
  if (!parsed.ok) throw new Error("fixture should parse");
  const documents = createMemoryDocumentStore();
  const profiles = createMemoryProfileStore();
  const first = await analyzeDocument(
    parsed.text,
    parsed.sections,
    { state: "CA", pets: false, redLines: ["No convenience fees"] },
    { callModelDeps: { fetchFn: stub({ flags: flagsFor(sidecar.clauses) }), apiKey: "k", model: "m" } },
  );
  const saved = await documents.insert("u1", {
    title: "Lease",
    extractedText: parsed.text,
    sections: parsed.sections,
    profileSnapshot: { state: "CA", pets: false, redLines: ["No convenience fees"] },
    report: first,
  });
  await profiles.save("u1", {
    answers: { state: "NY", pets: true },
    redLines: [{ id: "r1", text: "Auto-renewal" }],
  });
  return { documents, profiles, saved, parsed, first };
}

function handlerFor(
  s: Awaited<ReturnType<typeof setup>>,
  userRef: { id: string | null },
  fetchFn: FetchLike,
) {
  const calls = { classify: 0, profiles: [] as unknown[] };
  const deps: AnalyzeHandlerDeps = {
    getUser: async () => (userRef.id ? { id: userRef.id } : null),
    documents: s.documents,
    profiles: s.profiles,
    gate: {
      classify: async () => {
        calls.classify++;
        return { status: "pass", documentType: "residential-lease" };
      },
      analyze: (text, sections, profile) => {
        calls.profiles.push(profile);
        return analyzeDocument(text, sections, profile, {
          callModelDeps: { fetchFn, apiKey: "k", model: "m" },
        });
      },
    },
  };
  const call = (body: unknown) =>
    handleAnalyzeRequest(
      new Request("http://localhost/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
      deps,
    );
  return { call, calls };
}

describe("re-run a saved document", () => {
  it("replaces the report and profile snapshot using stored text and sections only", async () => {
    const s = await setup();
    const seen: string[] = [];
    const subset = sidecar.clauses.slice(0, 2);
    const { call, calls } = handlerFor(s, { id: "u1" }, stub({ flags: flagsFor(subset) }, seen));
    const res = await call({ documentId: s.saved.id });
    expect(res.status).toBe(200);
    expect((await res.json()).id).toBe(s.saved.id);

    const row = (await s.documents.get("u1", s.saved.id))!;
    expect(row.report).not.toEqual(s.first);
    expect(row.report.riskFlags).toHaveLength(subset.length);
    expect(row.report.riskFlags.length).toBeLessThan(s.first.riskFlags.length);
    expect(row.profileSnapshot.state).toBe("NY");
    expect(row.profileSnapshot.redLines).toEqual(["Auto-renewal"]);
    expect(await s.documents.list("u1")).toHaveLength(1);
    expect(row.extractedText).toBe(s.parsed.text);
    expect(calls.classify).toBe(0);
    expect(seen.length).toBeGreaterThan(0);
    expect(seen.some((b) => b.includes(subset[0].sourceSentence.slice(0, 40)))).toBe(true);
  });

  it("new citations verify and loadReport still passes", async () => {
    const s = await setup();
    const { call } = handlerFor(s, { id: "u1" }, stub({ flags: flagsFor(sidecar.clauses.slice(0, 3)) }));
    expect((await call({ documentId: s.saved.id })).status).toBe(200);
    const row = (await s.documents.get("u1", s.saved.id))!;
    for (const f of row.report.riskFlags) {
      expect(verifyCitation(f.sourceSentence, row.extractedText, row.sections)).toBe(true);
    }
    const loaded = await loadReport(s.documents, "u1", s.saved.id, () => {
      throw new Error("blocker logged");
    });
    expect(loaded.ok).toBe(true);
  });

  it("a flag with an invented sentence never reaches the saved report", async () => {
    const s = await setup();
    const bad = [
      ...flagsFor(sidecar.clauses.slice(0, 1)),
      { ...flagsFor(sidecar.clauses.slice(1, 2))[0], sourceSentence: "The landlord may enter at any hour." },
    ];
    const { call } = handlerFor(s, { id: "u1" }, stub({ flags: bad }));
    await call({ documentId: s.saved.id });
    const row = (await s.documents.get("u1", s.saved.id))!;
    for (const f of row.report.riskFlags) {
      expect(verifyCitation(f.sourceSentence, row.extractedText, row.sections)).toBe(true);
    }
  });

  it("another user cannot re-run the document, and the row is untouched", async () => {
    const s = await setup();
    await s.profiles.save("u2", { answers: { state: "TX" }, redLines: [] });
    const before = structuredClone((await s.documents.get("u1", s.saved.id))!);
    const { call, calls } = handlerFor(s, { id: "u2" }, stub({ flags: [] }));
    const res = await call({ documentId: s.saved.id });
    expect(res.status).toBe(404);
    expect(calls.profiles).toHaveLength(0);
    expect(await s.documents.get("u1", s.saved.id)).toEqual(before);
    expect(await s.documents.list("u2")).toEqual([]);
  });

  it("refuses a signed-out request without touching the row", async () => {
    const s = await setup();
    const before = structuredClone((await s.documents.get("u1", s.saved.id))!);
    const { call, calls } = handlerFor(s, { id: null }, stub({ flags: [] }));
    const res = await call({ documentId: s.saved.id });
    expect(res.status).toBe(401);
    expect(calls.profiles).toHaveLength(0);
    expect(await s.documents.get("u1", s.saved.id)).toEqual(before);
  });

  it("a model failure leaves the old report and snapshot intact", async () => {
    const s = await setup();
    const before = structuredClone((await s.documents.get("u1", s.saved.id))!);
    const { call } = handlerFor(s, { id: "u1" }, stub({}, [], true));
    const res = await call({ documentId: s.saved.id });
    expect(res.status).toBe(502);
    expect(await s.documents.get("u1", s.saved.id)).toEqual(before);
  });

  it("rejects extra fields and a malformed id, and accepts no text", async () => {
    const s = await setup();
    const { call, calls } = handlerFor(s, { id: "u1" }, stub({ flags: [] }));
    for (const body of [
      { documentId: s.saved.id, text: "Rent is due." },
      { documentId: s.saved.id, profile: { state: "CA" } },
      { documentId: "../etc" },
      { documentId: 5 },
    ]) {
      expect((await call(body)).status).toBe(400);
    }
    expect((await call({ documentId: "missing-id" })).status).toBe(404);
    expect(calls.profiles).toHaveLength(0);
  });

  it("asks for a saved profile first", async () => {
    const s = await setup();
    const fresh = { ...s, profiles: createMemoryProfileStore() };
    const { call } = handlerFor(fresh, { id: "u1" }, stub({ flags: [] }));
    const res = await call({ documentId: s.saved.id });
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe("no-profile");
  });

  it("the browser helper sends only the document id", async () => {
    const sent: string[] = [];
    const spy: AnalyzeFetch = async (_u, init) => {
      sent.push(init.body);
      return { ok: true, status: 200, json: async () => ({ id: "abc" }) };
    };
    expect(await requestRerun("abc", spy)).toEqual({ status: "done", id: "abc" });
    expect(JSON.parse(sent[0])).toEqual({ documentId: "abc" });
  });

  it("only plain ids are accepted as a return target", () => {
    expect(parseRerunTarget("3f2a-91bc")).toBe("3f2a-91bc");
    for (const bad of ["//evil.com", "/library/x", "https://x.y", "a/b", "", undefined, ["a", "b"], "a?b=1"]) {
      expect(parseRerunTarget(bad as never)).toBeNull();
    }
  });
});
