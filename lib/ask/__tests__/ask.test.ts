import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import type { Report } from "../../analysis/types";
import { createMemoryDocumentStore } from "../../documents/memory-store";
import type { FetchLike } from "../../openrouter";
import { requestAnswer, type AskFetch } from "../client";
import { handleAskRequest, MAX_QUESTION_CHARS, type AskHandlerDeps } from "../handler";

const leaseText = readFileSync(path.resolve(process.cwd(), "tests/fixtures/qa-lease-excerpt.txt"), "utf-8");

const EMPTY_REPORT: Report = {
  verdict: "largely-standard",
  riskFlags: [],
  opportunityFlags: [],
  skippedSections: [],
  disclaimer: "Not legal advice.",
  verdictMessage: "Largely standard.",
};

function modelStub(payload: unknown): FetchLike {
  const content = JSON.stringify(payload);
  return (async () => ({
    ok: true,
    status: 200,
    json: async () => ({ id: "x", choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: "stop" }] }),
    text: async () => content,
  })) as never;
}

const failingFetch: FetchLike = (async () => {
  throw new Error("network down");
}) as never;

async function setup(opts: { fetchFn: FetchLike; signedIn?: boolean }) {
  const store = createMemoryDocumentStore();
  const doc = await store.insert("user-a", {
    title: "Excerpt",
    extractedText: leaseText,
    sections: [{ id: "s1", text: leaseText, readable: true }],
    profileSnapshot: { state: "CA" },
    report: EMPTY_REPORT,
  });
  const logger = vi.fn();
  const deps: AskHandlerDeps = {
    getUser: async () => (opts.signedIn === false ? null : { id: "user-a" }),
    store,
    engine: { fetchFn: opts.fetchFn, apiKey: "k", model: "m" },
    logger,
  };
  const ask = (body: unknown, d: AskHandlerDeps = deps) =>
    handleAskRequest(
      new Request("http://test/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
      d,
    );
  return { store, doc, deps, ask, logger };
}

describe("ask handler", () => {
  it("returns an answer whose quotes are verbatim in the stored text", async () => {
    const { doc, ask } = await setup({
      fetchFn: modelStub({
        grounding: "document",
        isGeneralAdvice: false,
        answer: "The late fee is $75.",
        sourceSentences: ["Tenant shall pay a late fee of $75."],
      }),
    });
    const res = await ask({ documentId: doc.id, question: "What is my late fee?" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.kind).toBe("answer");
    expect(body.groundedIn).toBe("document");
    expect(body.sourceSentences.length).toBeGreaterThan(0);
    for (const s of body.sourceSentences) expect(leaseText.includes(s)).toBe(true);
  });

  it("returns a refusal (200) for an unanswerable factual question", async () => {
    const { doc, ask } = await setup({
      fetchFn: modelStub({ grounding: "none", isGeneralAdvice: false, answer: "", sourceSentences: [] }),
    });
    const res = await ask({ documentId: doc.id, question: "My landlord said I could paint. Is that okay?" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.kind).toBe("refusal");
    expect(body.reason).toBe("outside-document-and-state-standard");
  });

  it("returns a differently worded refusal for general advice", async () => {
    const { doc, ask } = await setup({
      fetchFn: modelStub({ grounding: "none", isGeneralAdvice: true, answer: "", sourceSentences: [] }),
    });
    const res = await ask({ documentId: doc.id, question: "Should I sign this?" });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.kind).toBe("refusal");
    expect(body.reason).toBe("general-advice-not-grounded");
  });

  it("BLOCKING: a fabricated quote from the model becomes an error, never an answer", async () => {
    const { doc, ask, logger } = await setup({
      fetchFn: modelStub({
        grounding: "document",
        isGeneralAdvice: false,
        answer: "Pets are allowed with a deposit.",
        sourceSentences: ["Pets are welcome with a $500 deposit."],
      }),
    });
    const res = await ask({ documentId: doc.id, question: "Can I have a pet?" });
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.kind).toBeUndefined();
    expect(body.code).toBe("ask-failed");
    expect(JSON.stringify(body)).not.toContain("welcome");
    expect(logger.mock.calls[0][0]).toMatch(/not found in stored text/);
  });

  it("BLOCKING: the handler re-checks quotes even when the answer function returns a fabricated one", async () => {
    const { doc, deps, ask, logger } = await setup({ fetchFn: failingFetch });
    const res = await ask(
      { documentId: doc.id, question: "q" },
      {
        ...deps,
        answer: async () => ({
          kind: "answer",
          text: "Invented.",
          groundedIn: "document",
          sourceSentences: ["This sentence is not in the lease."],
        }),
      },
    );
    expect(res.status).toBe(502);
    expect((await res.json()).kind).toBeUndefined();
    expect(logger).toHaveBeenCalledOnce();
  });

  it("a document-grounded answer with no quote is an error", async () => {
    const { doc, deps, ask } = await setup({ fetchFn: failingFetch });
    const res = await ask(
      { documentId: doc.id, question: "q" },
      { ...deps, answer: async () => ({ kind: "answer", text: "Unquoted.", groundedIn: "both", sourceSentences: [] }) },
    );
    expect(res.status).toBe(502);
  });

  it("passes a state-data answer through with no quotes", async () => {
    const { doc, ask } = await setup({
      fetchFn: modelStub({
        grounding: "state-standard",
        isGeneralAdvice: false,
        answer: "California limits late fees to a typical $50.",
        sourceSentences: [],
      }),
    });
    const body = await (await ask({ documentId: doc.id, question: "Is a $75 late fee normal here?" })).json();
    expect(body.kind).toBe("answer");
    expect(body.groundedIn).toBe("state-standard");
    expect(body.sourceSentences).toEqual([]);
  });

  it("a model failure is an error, not a refusal", async () => {
    const { doc, ask } = await setup({ fetchFn: failingFetch });
    const res = await ask({ documentId: doc.id, question: "What is my late fee?" });
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.kind).toBeUndefined();
    expect(body.code).toBe("ask-failed");
  });

  it("a malformed model reply is an error, not a refusal", async () => {
    const { doc, ask } = await setup({ fetchFn: modelStub({ nonsense: true }) });
    const res = await ask({ documentId: doc.id, question: "What is my late fee?" });
    expect(res.status).toBe(502);
  });

  it("another user's document is not found", async () => {
    const { doc, deps, ask } = await setup({ fetchFn: failingFetch });
    const res = await ask({ documentId: doc.id, question: "q" }, { ...deps, getUser: async () => ({ id: "user-b" }) });
    expect(res.status).toBe(404);
    expect((await res.json()).code).toBe("not-found");
  });

  it("signed-out is 401", async () => {
    const { doc, ask } = await setup({ fetchFn: failingFetch, signedIn: false });
    const res = await ask({ documentId: doc.id, question: "q" });
    expect(res.status).toBe(401);
  });

  it("accepts only a document id and a question", async () => {
    const { doc, ask } = await setup({ fetchFn: failingFetch });
    const bad: unknown[] = [
      { documentId: doc.id, question: "q", text: "pasted lease" },
      { documentId: doc.id },
      { question: "q" },
      { documentId: doc.id, question: "   " },
      { documentId: doc.id, question: 5 },
      { documentId: "../etc/passwd", question: "q" },
      { documentId: doc.id, question: "x".repeat(MAX_QUESTION_CHARS + 1) },
      ["documentId", "question"],
    ];
    for (const body of bad) {
      const res = await ask(body);
      expect(res.status, JSON.stringify(body).slice(0, 60)).toBe(400);
    }
  });
});

describe("requestAnswer client", () => {
  const reply = (status: number, body: unknown): AskFetch => async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });

  it("sends only the id and the question", async () => {
    let sent = "";
    await requestAnswer("doc-1", "Hi?", async (_u, init) => {
      sent = init.body;
      return { ok: true, status: 200, json: async () => ({ kind: "refusal", reason: "x", text: "no" }) };
    });
    expect(Object.keys(JSON.parse(sent)).sort()).toEqual(["documentId", "question"]);
  });

  it("maps refusal, error and network failure to distinct statuses", async () => {
    expect((await requestAnswer("d", "q", reply(200, { kind: "refusal", reason: "r", text: "no" }))).status).toBe("refusal");
    expect((await requestAnswer("d", "q", reply(502, { error: "Failed", code: "ask-failed" }))).status).toBe("error");
    expect((await requestAnswer("d", "q", reply(401, {}))).status).toBe("signed-out");
    const thrown = await requestAnswer("d", "q", async () => {
      throw new Error("offline");
    });
    expect(thrown.status).toBe("error");
  });
});
