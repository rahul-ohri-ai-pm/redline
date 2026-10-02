import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { callModel, type CallModelOptions } from "../../openrouter";
import { classifyDocument, type ModelCall } from "../classify";
import { requestGate } from "../client";
import { handleGateRequest } from "../handler";
import { runAnalysisIfLease } from "../run";
import type { Report } from "../../analysis/types";

const FIX = join(__dirname, "..", "..", "..", "tests", "fixtures");
const read = (p: string) => readFileSync(join(FIX, p), "utf8");

const lease = read("clean-lease.txt");
const freelance = read("gate/freelance-agreement.txt");
const tos = read("gate/terms-of-service.txt");
const nonDoc = read("gate/non-document.txt");

/**
 * A stand-in for the model: reads the document out of the prompt it was
 * sent and answers the way a model would, from the document's own content.
 */
const stubModel: ModelCall = async (options: CallModelOptions) => {
  const prompt = options.messages.map((m) => m.content).join("\n");
  const doc = prompt.slice(prompt.indexOf("<document>"));
  if (/RESIDENTIAL LEASE/.test(doc)) return { documentType: "residential-lease" };
  if (/INDEPENDENT CONTRACTOR/.test(doc)) return { documentType: "freelance-agreement" };
  if (/TERMS OF SERVICE/.test(doc)) return { documentType: "terms-of-service" };
  return { documentType: "other" };
};

describe("classifyDocument", () => {
  it("passes a residential lease", async () => {
    expect(await classifyDocument(lease, { modelCall: stubModel })).toEqual({
      status: "pass",
      documentType: "residential-lease",
    });
  });

  it.each([
    ["a freelance agreement", freelance, "freelance-agreement"],
    ["a Terms of Service document", tos, "terms-of-service"],
    ["a non-document", nonDoc, "other"],
  ])("refuses %s", async (_name, text, type) => {
    expect(await classifyDocument(text, { modelCall: stubModel })).toEqual({
      status: "refused",
      documentType: type,
    });
  });

  it("returns an error, not a pass, when the model call fails", async () => {
    const modelCall: ModelCall = async () => {
      throw new Error("network down");
    };
    const r = await classifyDocument(lease, { modelCall });
    expect(r.status).toBe("error");
  });

  it.each([
    ["an unknown type", { documentType: "commercial-lease" }],
    ["a missing field", {}],
    ["a non-object", "residential-lease"],
    ["null", null],
    ["a wrong-typed field", { documentType: 3 }],
  ])("returns an error, not a pass, for %s", async (_n, raw) => {
    const r = await classifyDocument(lease, { modelCall: async () => raw });
    expect(r.status).toBe("error");
  });

  it("goes through callModel with a strict json_schema listing the four types, and sends only the text", async () => {
    const fetchFn = vi.fn(async (_url: string, init?: { body?: string }) => ({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({ documentType: "residential-lease" }) } }],
      }),
      text: async () => "",
      init,
    }));
    const r = await classifyDocument(lease, {
      modelCall: (o) => callModel(o, { fetchFn, apiKey: "k", model: "m" }),
    });
    expect(r.status).toBe("pass");
    const sent = JSON.parse(fetchFn.mock.calls[0][1]!.body as string);
    expect(sent.response_format.type).toBe("json_schema");
    expect(sent.response_format.json_schema.schema.properties.documentType.enum).toEqual([
      "residential-lease",
      "freelance-agreement",
      "terms-of-service",
      "other",
    ]);
    expect(sent.messages.map((m: { content: string }) => m.content).join("\n")).toContain(
      "RESIDENTIAL LEASE AGREEMENT"
    );
  });

  it("turns a missing OpenRouter key into an error at call time", async () => {
    const saved = process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    try {
      const r = await classifyDocument(lease);
      expect(r.status).toBe("error");
    } finally {
      if (saved !== undefined) process.env.OPENROUTER_API_KEY = saved;
    }
  });
});

describe("runAnalysisIfLease", () => {
  const profile = { state: "CA" } as never;
  const fakeReport = { verdict: "x" } as unknown as Report;

  it("calls analyzeDocument for a lease", async () => {
    const analyze = vi.fn(async () => fakeReport);
    const r = await runAnalysisIfLease(lease, [], profile, {
      classify: (t) => classifyDocument(t, { modelCall: stubModel }),
      analyze,
    });
    expect(r).toEqual({ status: "analyzed", report: fakeReport });
    expect(analyze).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["freelance", freelance],
    ["terms of service", tos],
    ["a non-document", nonDoc],
  ])("never calls analyzeDocument for %s", async (_n, text) => {
    const analyze = vi.fn(async () => fakeReport);
    const r = await runAnalysisIfLease(text, [], profile, {
      classify: (t) => classifyDocument(t, { modelCall: stubModel }),
      analyze,
    });
    expect(r.status).toBe("refused");
    expect(analyze).not.toHaveBeenCalled();
  });

  it("never calls analyzeDocument when the gate errors", async () => {
    const analyze = vi.fn(async () => fakeReport);
    const r = await runAnalysisIfLease(lease, [], profile, {
      classify: (t) =>
        classifyDocument(t, {
          modelCall: async () => {
            throw new Error("boom");
          },
        }),
      analyze,
    });
    expect(r.status).toBe("error");
    expect(analyze).not.toHaveBeenCalled();
  });
});

describe("/api/gate handler and client", () => {
  const post = (body: unknown) =>
    new Request("http://localhost/api/gate", {
      method: "POST",
      body: typeof body === "string" ? body : JSON.stringify(body),
    });

  it("answers with the document type for a text-only body", async () => {
    const res = await handleGateRequest(post({ text: freelance }), { modelCall: stubModel });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ documentType: "freelance-agreement" });
  });

  it.each([
    ["extra fields", { text: "a", file: "b" }],
    ["no text", {}],
    ["non-string text", { text: 5 }],
    ["empty text", { text: "  " }],
    ["a bare string", "not json"],
  ])("rejects %s with 400 and never calls the model", async (_n, body) => {
    const modelCall = vi.fn(stubModel);
    const res = await handleGateRequest(post(body), { modelCall });
    expect(res.status).toBe(400);
    expect(modelCall).not.toHaveBeenCalled();
  });

  it("answers 502 when classification fails", async () => {
    const res = await handleGateRequest(post({ text: lease }), {
      modelCall: async () => ({ nope: true }),
    });
    expect(res.status).toBe(502);
  });

  it("the client sends a body containing only text", async () => {
    const fetchFn = vi.fn(async (_u: string, _i: { body: string }) => ({
      ok: true,
      json: async () => ({ documentType: "terms-of-service" }),
    }));
    const r = await requestGate(tos, fetchFn);
    expect(r).toEqual({ status: "refused", documentType: "terms-of-service" });
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe("/api/gate");
    expect(JSON.parse(init.body)).toEqual({ text: tos });
  });

  it("the client turns a failed request or a malformed answer into an error", async () => {
    expect(
      (await requestGate("x", async () => ({ ok: false, json: async () => ({}) }))).status
    ).toBe("error");
    expect(
      (await requestGate("x", async () => ({ ok: true, json: async () => ({ documentType: "??" }) })))
        .status
    ).toBe("error");
    expect(
      (await requestGate("x", async () => {
        throw new Error("offline");
      })).status
    ).toBe("error");
  });
});
