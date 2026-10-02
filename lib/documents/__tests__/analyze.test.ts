import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { analyzeDocument } from "../../analysis-engine";
import { verifyCitation } from "../../analysis/citation";
import { DISCLAIMER_TEXT } from "../../analysis/copy";
import type { Report, Section } from "../../analysis/types";
import type { FetchLike } from "../../openrouter";
import { parseFile, type ParseOutcome } from "../../parse";
import { createMemoryProfileStore } from "../../profile/memory-store";
import type { GateOutcome } from "../../gate/types";
import { handleAnalyzeRequest, type AnalyzeHandlerDeps } from "../analyze-handler";
import { requestAnalysis, titleFromFileName, type AnalyzeFetch } from "../client";
import { createMemoryDocumentStore } from "../memory-store";

const FIXTURES = path.resolve(process.cwd(), "tests/fixtures");
const adhesionRaw = readFileSync(path.join(FIXTURES, "adhesion-lease.txt"), "utf-8");
const sidecar = JSON.parse(
  readFileSync(path.join(FIXTURES, "adhesion-lease.sidecar.json"), "utf-8"),
) as { clauses: { clauseType: string; sourceSentence: string; expectedSeverity: string }[] };

const PASS: GateOutcome = { status: "pass", documentType: "residential-lease" };

function stubFetch(payload: unknown): FetchLike {
  const content = JSON.stringify(payload);
  return async () =>
    ({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: "stop" }],
      }),
      text: async () => content,
    }) as never;
}

function sidecarFlags() {
  return sidecar.clauses.map((c) => ({
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

async function previewOf(raw: string, name = "adhesion-lease.txt") {
  const outcome: ParseOutcome = await parseFile({
    name,
    type: "text/plain",
    arrayBuffer: async () => new TextEncoder().encode(raw).buffer as ArrayBuffer,
  });
  if (!outcome.ok) throw new Error("fixture should parse");
  return outcome;
}

interface Harness {
  deps: AnalyzeHandlerDeps;
  documents: ReturnType<typeof createMemoryDocumentStore>;
  profiles: ReturnType<typeof createMemoryProfileStore>;
  analyzed: { text: string; sections: Section[]; profile: unknown; report?: Report }[];
  modelCalls: () => number;
  /** A fetch that routes the browser's request to the handler as a signed-in user. */
  fetchAs: (userId: string | null) => AnalyzeFetch;
  handle: (userId: string | null, init: RequestInit) => Promise<Response>;
}

function harness(opts: { gate?: GateOutcome; payload?: unknown } = {}): Harness {
  const documents = createMemoryDocumentStore();
  const profiles = createMemoryProfileStore();
  const analyzed: Harness["analyzed"] = [];
  let calls = 0;
  const base = stubFetch(opts.payload ?? { flags: sidecarFlags() });
  const fetchFn: FetchLike = (...args) => {
    calls++;
    return base(...args);
  };
  let current: string | null = null;
  const deps: AnalyzeHandlerDeps = {
    getUser: async () => (current ? { id: current } : null),
    documents,
    profiles,
    gate: {
      classify: async () => opts.gate ?? PASS,
      analyze: async (text, sections, profile) => {
        const entry: Harness["analyzed"][number] = { text, sections, profile };
        analyzed.push(entry);
        const report = await analyzeDocument(text, sections, profile, {
          callModelDeps: { fetchFn, apiKey: "test-key", model: "test/model" },
        });
        entry.report = report;
        return report;
      },
    },
  };
  const handle = (userId: string | null, init: RequestInit) => {
    current = userId;
    return handleAnalyzeRequest(new Request("http://localhost/api/analyze", init), deps);
  };
  return {
    deps,
    documents,
    profiles,
    analyzed,
    modelCalls: () => calls,
    handle,
    fetchAs: (userId) => async (_url, init) => {
      const res = await handle(userId, init);
      return { ok: res.ok, status: res.status, json: () => res.json() };
    },
  };
}

const post = (body: unknown, headers: Record<string, string> = { "Content-Type": "application/json" }) => ({
  method: "POST",
  headers,
  body: typeof body === "string" ? body : JSON.stringify(body),
});

async function saveProfile(h: Harness, userId: string) {
  await h.profiles.save(userId, {
    answers: { state: "CA", pets: false },
    redLines: [
      { id: "r1", text: "No convenience fees" },
      { id: "r2", text: "Auto-renewal" },
    ],
  });
}

describe("session and request shape", () => {
  it("returns 401 without a session, before reading the body or calling the model", async () => {
    const h = harness();
    const res = await h.handle(null, post({ text: "x", sections: [], title: "t" }));
    expect(res.status).toBe(401);
    expect(h.modelCalls()).toBe(0);
    expect(await h.documents.list("u1")).toEqual([]);
  });

  it("refuses a multipart or non-JSON body", async () => {
    const h = harness();
    await saveProfile(h, "u1");
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array([0, 1, 2, 255])]), "lease.pdf");
    const res = await h.handle("u1", { method: "POST", body: form });
    expect(res.status).toBe(415);
    const res2 = await h.handle("u1", post("text=hello", { "Content-Type": "text/plain" }));
    expect(res2.status).toBe(415);
    expect(h.analyzed).toHaveLength(0);
  });

  it.each([
    ["a file field", { text: "Rent is due.", sections: [], title: "t", file: "AAAA" }],
    ["a base64 blob field", { text: "Rent is due.", sections: [], title: "t", bytes: "JVBERi0=" }],
    ["a filename field", { text: "Rent is due.", sections: [], title: "t", fileName: "a.pdf" }],
    ["a profile override", { text: "Rent is due.", sections: [], title: "t", profile: { state: "CA" } }],
    ["a missing title", { text: "Rent is due.", sections: [] }],
    ["a blank title", { text: "Rent is due.", sections: [], title: "   " }],
    ["empty text", { text: "  ", sections: [], title: "t" }],
    ["NUL bytes in the text", { text: "Rent\u0000is due.", sections: [], title: "t" }],
    ["a section with extra keys", { text: "Rent is due.", sections: [{ id: "a", text: "x", readable: true, data: "AA" }], title: "t" }],
    ["an unreadable section carrying text", { text: "Rent is due.", sections: [{ id: "a", text: "x", readable: false, reason: "r" }], title: "t" }],
    ["sections that are not an array", { text: "Rent is due.", sections: "none", title: "t" }],
    ["a JSON array", [1, 2]],
  ])("rejects %s with 400 and stores nothing", async (_label, body) => {
    const h = harness();
    await saveProfile(h, "u1");
    const res = await h.handle("u1", post(body));
    expect(res.status).toBe(400);
    expect(h.analyzed).toHaveLength(0);
    expect(await h.documents.list("u1")).toEqual([]);
  });

  it("asks for a saved profile first and does not call the model", async () => {
    const h = harness();
    const res = await h.handle("u1", post({ text: "Rent is due.", sections: [], title: "t" }));
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe("no-profile");
    expect(h.modelCalls()).toBe(0);
  });

  it("the browser sends only text, sections and title, as plain JSON text", async () => {
    const sent: { body: string; headers: Record<string, string> }[] = [];
    const spy: AnalyzeFetch = async (_url, init) => {
      sent.push({ body: init.body, headers: init.headers });
      return { ok: false, status: 500, json: async () => ({}) };
    };
    const parsed = await previewOf(adhesionRaw);
    await requestAnalysis({ text: parsed.text, sections: parsed.sections, title: "My lease" }, spy);
    expect(sent).toHaveLength(1);
    expect(typeof sent[0].body).toBe("string");
    expect(sent[0].headers["Content-Type"]).toBe("application/json");
    const body = JSON.parse(sent[0].body);
    expect(Object.keys(body).sort()).toEqual(["sections", "text", "title"]);
    expect(body.text).toBe(parsed.text);
    expect(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(sent[0].body)).toBe(false);
  });
});

describe("what is previewed is what is analyzed and what is stored", () => {
  it("keeps one string through preview, analysis and storage, with every fixture sentence intact", async () => {
    const h = harness();
    await saveProfile(h, "u1");
    const preview = await previewOf(adhesionRaw);

    const result = await requestAnalysis(
      { text: preview.text, sections: preview.sections, title: "Adhesion lease" },
      h.fetchAs("u1"),
    );
    expect(result.status).toBe("saved");
    if (result.status !== "saved") return;

    expect(h.analyzed).toHaveLength(1);
    const stored = await h.documents.get("u1", result.id);
    expect(stored).not.toBeNull();
    expect(h.analyzed[0].text).toBe(preview.text);
    expect(stored!.extractedText).toBe(preview.text);
    expect(stored!.extractedText).toBe(h.analyzed[0].text);
    expect(stored!.sections).toEqual(preview.sections);
    for (const clause of sidecar.clauses) {
      expect(preview.text.includes(clause.sourceSentence)).toBe(true);
      expect(h.analyzed[0].text.includes(clause.sourceSentence)).toBe(true);
      expect(stored!.extractedText.includes(clause.sourceSentence)).toBe(true);
    }
  });

  it("a citation verified at analysis time still verifies after a save-and-load round trip", async () => {
    const h = harness();
    await saveProfile(h, "u1");
    const preview = await previewOf(adhesionRaw);
    const res = await h.handle(
      "u1",
      post({ text: preview.text, sections: preview.sections, title: "Adhesion lease" }),
    );
    expect(res.status).toBe(201);
    const { id } = await res.json();

    const analyzedReport = h.analyzed[0].report!;
    expect(analyzedReport.riskFlags.length).toBe(sidecar.clauses.length);
    // Verified against the analyzed text at analysis time.
    for (const flag of analyzedReport.riskFlags) {
      expect(verifyCitation(flag.sourceSentence, h.analyzed[0].text, h.analyzed[0].sections)).toBe(true);
    }
    // And against the stored text after loading it back.
    const loaded = await h.documents.get("u1", id);
    expect(loaded!.report.riskFlags.length).toBe(analyzedReport.riskFlags.length);
    for (const flag of loaded!.report.riskFlags) {
      expect(verifyCitation(flag.sourceSentence, loaded!.extractedText, loaded!.sections)).toBe(true);
    }
    // Saved exactly as the engine returned it.
    expect(loaded!.report).toEqual(analyzedReport);
  });

  it("stores the profile and red lines the analysis actually ran against", async () => {
    const h = harness();
    await saveProfile(h, "u1");
    const preview = await previewOf(adhesionRaw);
    const res = await h.handle("u1", post({ text: preview.text, sections: preview.sections, title: "x" }));
    const { id } = await res.json();
    const expected = { state: "CA", pets: false, redLines: ["No convenience fees", "Auto-renewal"] };
    expect(h.analyzed[0].profile).toEqual(expected);
    expect((await h.documents.get("u1", id))!.profileSnapshot).toEqual(expected);
  });

  it("saves skipped sections and the disclaimer unchanged", async () => {
    const h = harness();
    await saveProfile(h, "u1");
    const sentence = sidecar.clauses[0].sourceSentence;
    const sections: Section[] = [
      { id: "page-1", text: sentence, readable: true },
      { id: "page-2", text: null, readable: false, reason: "This page looks scrambled." },
    ];
    const res = await h.handle("u1", post({ text: sentence, sections, title: "Partial lease" }));
    expect(res.status).toBe(201);
    const { id } = await res.json();
    const stored = (await h.documents.get("u1", id))!;
    expect(stored.sections).toEqual(sections);
    expect(stored.sections[1].text).toBeNull();
    expect(stored.report.skippedSections).toEqual([
      { id: "page-2", reason: "This page looks scrambled." },
    ]);
    expect(stored.report.disclaimer).toBe(DISCLAIMER_TEXT);
    expect(stored.report).toEqual(h.analyzed[0].report);
  });

  it("stores only the title, not the file name", async () => {
    const h = harness();
    await saveProfile(h, "u1");
    const preview = await previewOf(adhesionRaw, "secret-name.final.txt");
    const res = await h.handle("u1", post({ text: preview.text, sections: preview.sections, title: "  Elm   Street lease " }));
    const { id } = await res.json();
    const stored = await h.documents.get("u1", id);
    expect(stored!.title).toBe("Elm Street lease");
    expect(JSON.stringify(stored)).not.toContain("secret-name");
  });

  it("refuses a document the gate refuses, without analyzing or storing it", async () => {
    const h = harness({ gate: { status: "refused", documentType: "terms-of-service" } });
    await saveProfile(h, "u1");
    const res = await h.handle("u1", post({ text: "Terms apply.", sections: [], title: "t" }));
    expect(res.status).toBe(422);
    expect(h.analyzed).toHaveLength(0);
    expect(await h.documents.list("u1")).toEqual([]);
  });

  it("stores nothing when the gate cannot decide", async () => {
    const h = harness({ gate: { status: "error", message: "down" } });
    await saveProfile(h, "u1");
    const res = await h.handle("u1", post({ text: "Terms apply.", sections: [], title: "t" }));
    expect(res.status).toBe(502);
    expect(await h.documents.list("u1")).toEqual([]);
  });
});

describe("DocumentStore ownership (in-memory fake)", () => {
  const doc = (title: string) => ({
    title,
    extractedText: "Rent is due on the first.",
    sections: [{ id: "s1", text: "Rent is due on the first.", readable: true as const }],
    profileSnapshot: { state: "CA" },
    report: {
      verdict: "largely-standard" as const,
      riskFlags: [],
      opportunityFlags: [],
      skippedSections: [],
      disclaimer: DISCLAIMER_TEXT,
      verdictMessage: "ok",
    },
  });

  it("user A cannot read, update or delete user B's documents", async () => {
    const store = createMemoryDocumentStore();
    const b = await store.insert("B", doc("B's lease"));
    expect(await store.get("A", b.id)).toBeNull();
    expect(await store.list("A")).toEqual([]);
    expect(await store.update("A", b.id, { title: "hijacked" })).toBe(false);
    expect(await store.remove("A", b.id)).toBe(false);
    const still = await store.get("B", b.id);
    expect(still?.title).toBe("B's lease");
  });

  it("lists newest first and lets the owner update and delete", async () => {
    const store = createMemoryDocumentStore();
    const first = await store.insert("A", doc("first"));
    const second = await store.insert("A", doc("second"));
    expect((await store.list("A")).map((d) => d.id)).toEqual([second.id, first.id]);
    expect(await store.update("A", first.id, { title: "renamed" })).toBe(true);
    expect((await store.get("A", first.id))!.title).toBe("renamed");
    expect(await store.remove("A", first.id)).toBe(true);
    expect(await store.get("A", first.id)).toBeNull();
  });
});

describe("no path accepts the original file", () => {
  const root = process.cwd();
  function walk(dir: string, out: string[] = []): string[] {
    for (const name of readdirSync(dir)) {
      const p = path.join(dir, name);
      if (statSync(p).isDirectory()) walk(p, out);
      else out.push(p);
    }
    return out;
  }
  const strip = (s: string) =>
    s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/--.*$/gm, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

  it("no migration has a binary or file column, bucket or file-name column", () => {
    const dir = path.join(root, "supabase/migrations");
    const files = walk(dir).filter((f) => f.endsWith(".sql"));
    expect(files.length).toBeGreaterThan(0);
    for (const f of files) {
      const sql = strip(readFileSync(f, "utf-8")).toLowerCase();
      expect(sql, f).not.toMatch(/\bbytea\b|\bblob\b|\blo_|storage\.(buckets|objects)|file_name|filename|file_path|\bfile\b/);
    }
  });

  it("no api route reads multipart, form data, raw bytes or files", () => {
    const files = [
      ...walk(path.join(root, "app/api")),
      ...walk(path.join(root, "lib/documents")).filter((f) => !f.includes("__tests__")),
    ].filter((f) => /\.tsx?$/.test(f));
    expect(files.length).toBeGreaterThan(0);
    for (const f of files) {
      const src = strip(readFileSync(f, "utf-8"));
      expect(src, f).not.toMatch(/formData\s*\(|multipart|arrayBuffer\s*\(|\.blob\s*\(|\bFormData\b|\bFile\b|bytea|Buffer\.from/);
    }
  });
});

describe("title from file name", () => {
  it("drops the extension and any folder path", () => {
    expect(titleFromFileName("Elm St lease.pdf")).toBe("Elm St lease");
    expect(titleFromFileName("C:\\docs\\lease.final.docx")).toBe("lease.final");
    expect(titleFromFileName(".hidden")).toBe(".hidden");
    expect(titleFromFileName(null)).toBe("");
  });
});
