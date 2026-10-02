import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { analyzeDocument } from "../../analysis-engine";
import type { RenterProfile, Report } from "../../analysis/types";
import { createMemoryDocumentStore } from "../../documents/memory-store";
import { loadReport } from "../../library/load";
import type { FetchLike } from "../../openrouter";
import { buildReportView } from "../view-model";

const dir = path.resolve(process.cwd(), "tests/fixtures");
const text = readFileSync(path.join(dir, "adhesion-lease.txt"), "utf-8");
const sidecar = JSON.parse(readFileSync(path.join(dir, "adhesion-lease.sidecar.json"), "utf-8")) as {
  clauses: { clauseType: string; sourceSentence: string; expectedSeverity: "high" | "medium" | "low" }[];
};
const sections = [{ id: "a", text, readable: true as const }];

function candidate(c: (typeof sidecar.clauses)[number], oneSidedness: string) {
  return {
    clauseType: c.clauseType,
    sourceSentence: c.sourceSentence,
    label: `does something related to ${c.clauseType}`,
    confidence: "high",
    oneSidedness,
    dollarAmount: oneSidedness === "medium" ? 50 : 500,
    noticeHours: null,
    noticeDays: c.clauseType === "auto-renewal" ? 90 : null,
  };
}

function stubFetch(flags: unknown[]): FetchLike {
  const content = JSON.stringify({ flags });
  return async () =>
    ({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: "stop" }] }),
      text: async () => content,
    }) as never;
}

async function reportFor(profile: RenterProfile, sides: string[]): Promise<Report> {
  const flags = sidecar.clauses.map((c, i) => candidate(c, sides[i % sides.length]));
  return analyzeDocument(text, sections, profile, {
    callModelDeps: { fetchFn: stubFetch(flags), apiKey: "test-key", model: "test/model" },
  });
}

describe("buildReportView on the adhesion lease", () => {
  it("groups by bucket in screen order, danger order inside each, with counts", async () => {
    const report = await reportFor({ state: "CA" }, ["high", "medium", "low", "high", "low", "medium"]);
    const view = buildReportView(report);

    expect(view.tallies.map((t) => t.bucket)).toEqual(["remove-modify", "push-on", "clarify"]);
    expect(view.tallies.every((t) => t.count > 0)).toBe(true);
    expect(view.groups.reduce((n, g) => n + g.flags.length, 0)).toBe(report.riskFlags.length);
    expect(view.totalFlags).toBe(report.riskFlags.length);
    for (const g of view.groups) {
      expect(view.tallies.find((t) => t.bucket === g.bucket)?.count).toBe(g.flags.length);
      expect(g.flags.every((f) => f.bucket === g.bucket)).toBe(true);
    }

    const danger = ["hidden-fee", "auto-renewal", "deposit-deduction", "early-termination", "right-of-entry", "guest-restriction", "unusual"];
    for (const g of view.groups) {
      const ranks = g.flags.map((f) => danger.indexOf(f.clauseType));
      expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
    }
  });

  it("passes wording, sentence and counter-offer through unchanged, counter-offer on remove/modify only", async () => {
    const report = await reportFor({ state: "CA" }, ["high", "medium", "low"]);
    const view = buildReportView(report);
    for (const f of view.groups.flatMap((g) => g.flags)) {
      const src = report.riskFlags.find((r) => r.id === f.id)!;
      expect(f.summary).toBe(src.summary);
      expect(f.sourceSentence).toBe(src.sourceSentence);
      expect(text.includes(f.sourceSentence)).toBe(true);
      if (src.bucket === "remove-modify") expect(f.counterOffer).toBe(src.counterOffer);
      else expect("counterOffer" in f).toBe(false);
    }
    expect(view.summary).toBe(report.verdictMessage);
    expect(view.disclaimer).toBe(report.disclaimer);
  });

  it("marks deprioritized flags and lists them after relevant ones in their bucket", async () => {
    const report = await reportFor({ state: "CA", pets: false, redLines: ["hidden fees"] }, ["high"]);
    const view = buildReportView(report);
    const quiet = view.groups.flatMap((g) => g.flags).filter((f) => f.deprioritized);
    expect(quiet.map((f) => f.clauseType)).toContain("guest-restriction");
    expect(view.tallies.reduce((n, t) => n + t.deprioritized, 0)).toBe(quiet.length);
    for (const g of view.groups) {
      const marks = g.flags.map((f) => Number(f.deprioritized));
      expect(marks).toEqual([...marks].sort((a, b) => a - b));
    }
    expect(view.totalFlags).toBe(report.riskFlags.length);
  });

  it("returns three zero tallies and no groups when there are no risk flags", () => {
    const view = buildReportView({
      verdict: "largely-standard",
      riskFlags: [],
      opportunityFlags: [],
      skippedSections: [],
      disclaimer: "d",
      verdictMessage: "m",
    });
    expect(view.tallies.map((t) => t.count)).toEqual([0, 0, 0]);
    expect(view.groups).toEqual([]);
  });
});

describe("report screen gate", () => {
  it("blocks and logs when a stored sentence is corrupted; a clean copy loads into the view", async () => {
    const report = await reportFor({ state: "CA" }, ["high"]);
    const bad: Report = structuredClone(report);
    bad.riskFlags[0].sourceSentence = bad.riskFlags[0].sourceSentence + " (altered)";
    const store = createMemoryDocumentStore();
    const base = { title: "Lease", extractedText: text, sections, profileSnapshot: { state: "CA" } };
    const savedBad = await store.insert("u1", { ...base, report: bad });
    const logger = vi.fn();
    expect(await loadReport(store, "u1", savedBad.id, logger)).toEqual({ ok: false, reason: "citation-failed" });
    expect(logger).toHaveBeenCalledTimes(1);

    const savedGood = await store.insert("u1", { ...base, report });
    const good = await loadReport(store, "u1", savedGood.id, logger);
    expect(good.ok).toBe(true);
    if (good.ok) expect(buildReportView(good.report).totalFlags).toBe(report.riskFlags.length);
    expect(logger).toHaveBeenCalledTimes(1);
  });
});
