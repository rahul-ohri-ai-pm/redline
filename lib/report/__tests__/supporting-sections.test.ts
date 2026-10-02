import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { analyzeDocument } from "../../analysis-engine";
import type { RenterProfile, Report, Section } from "../../analysis/types";
import type { FetchLike } from "../../openrouter";
import { buildReportView } from "../view-model";

const dir = path.resolve(process.cwd(), "tests/fixtures");
const read = (f: string) => readFileSync(path.join(dir, f), "utf-8");

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

function run(text: string, sections: Section[], profile: RenterProfile, flags: unknown[] = []) {
  return analyzeDocument(text, sections, profile, {
    callModelDeps: { fetchFn: stubFetch(flags), apiKey: "test-key", model: "test/model" },
  });
}

const cleanText = read("clean-lease.txt");
const cleanSections: Section[] = [{ id: "a", text: cleanText, readable: true }];

describe("clean lease, zero risk flags", () => {
  it("follows the engine: the view only says largely standard when there are no suggestions either", async () => {
    const report = await run(cleanText, cleanSections, { state: "CA" });
    expect(report.riskFlags).toEqual([]);
    const view = buildReportView(report, { state: "CA" });
    expect(view.suggestions.length).toBe(report.opportunityFlags.length);
    expect(view.largelyStandard).toBe(report.opportunityFlags.length === 0);
    expect(view.verdict).toBe(report.verdict);
    expect(view.summary).toBe(report.verdictMessage);
  });

  it("shows largely standard when both lists are empty and the engine agreed", async () => {
    const report = await run(cleanText, cleanSections, { state: "CA" });
    const bare: Report = { ...report, verdict: "largely-standard", opportunityFlags: [] };
    const view = buildReportView(bare, { state: "CA" });
    expect(view.largelyStandard).toBe(true);
    expect(view.verdictLabel).toBe("Looks standard");
    expect(view.suggestions).toEqual([]);
    expect(view.groups).toEqual([]);
  });
});

describe("suggestions-only report", () => {
  it("never shows largely standard and carries no source sentence on a suggestion", async () => {
    const lease = "RENT. Tenant pays $1,000 monthly. A late fee of $50 applies after the fifth day.";
    const report = await run(lease, [{ id: "a", text: lease, readable: true }], { state: "CA" });
    expect(report.verdict).toBe("opportunities-found");
    expect(report.opportunityFlags.length).toBeGreaterThan(0);

    const view = buildReportView(report, { state: "CA" });
    expect(view.largelyStandard).toBe(false);
    expect(view.verdict).toBe("opportunities-found");
    expect(view.verdictLabel).not.toBe("Looks standard");
    expect(view.suggestions.map((s) => s.suggestion)).toEqual(report.opportunityFlags.map((o) => o.suggestion));
    for (const s of view.suggestions) expect(Object.keys(s).sort()).toEqual(["id", "suggestion"]);
    expect(view.tallies.map((t) => t.count)).toEqual([0, 0, 0]);
  });

  it("does not let a stored report say largely standard next to suggestions or flags", async () => {
    const lease = "RENT. Tenant pays $1,000 monthly.";
    const report = await run(lease, [{ id: "a", text: lease, readable: true }], { state: "CA" });
    const contradictory: Report = { ...report, verdict: "largely-standard", verdictMessage: "Looks largely standard." };
    expect(report.opportunityFlags.length).toBeGreaterThan(0);
    const view = buildReportView(contradictory, { state: "CA" });
    expect(view.largelyStandard).toBe(false);
    expect(view.verdict).toBe("opportunities-found");
    expect(view.summary).not.toContain("largely standard");

    const withRisk: Report = {
      ...report,
      verdict: "largely-standard",
      riskFlags: [
        { id: "r1", clauseType: "hidden-fee", sourceSentence: "x", confidence: "high", summary: "s", relevant: true, bucket: "clarify" },
      ],
    };
    const v2 = buildReportView(withRisk, { state: "CA" });
    expect(v2.verdict).toBe("risks-found");
    expect(v2.largelyStandard).toBe(false);
  });
});

describe("report with skipped sections", () => {
  const sections = JSON.parse(read("partial-extraction-lease.sections.json")) as Section[];
  const text = sections
    .filter((s) => s.readable)
    .map((s) => s.text)
    .join("\n\n");

  it("lists exactly what the engine skipped, and names unanswered optional answers", async () => {
    const report = await run(text, sections, { state: "CA", pets: true });
    expect(report.skippedSections.length).toBeGreaterThan(0);
    const view = buildReportView(report, { state: "CA", pets: true });
    expect(view.skipped).toEqual(report.skippedSections);
    expect(view.unansweredFields).toEqual(["joint lease", "renter type"]);
    expect(view.precisionNote).toContain("joint lease, renter type");
    expect(view.precisionNote).toContain("less precise");
  });

  it("has no precision note when every optional answer exists, and no skipped entries when none were skipped", async () => {
    const full: RenterProfile = { state: "CA", pets: false, jointLease: false, renterType: "individual" };
    const report = await run(cleanText, cleanSections, full);
    const view = buildReportView(report, full);
    expect(view.skipped).toEqual([]);
    expect(view.precisionNote).toBeNull();
  });
});

describe("adhesion report and profile snapshot", () => {
  it("keeps the disclaimer and shows the profile it ran against", async () => {
    const text = read("adhesion-lease.txt");
    const sidecar = JSON.parse(read("adhesion-lease.sidecar.json")) as {
      clauses: { clauseType: string; sourceSentence: string }[];
    };
    const flags = sidecar.clauses.map((c) => ({
      clauseType: c.clauseType,
      sourceSentence: c.sourceSentence,
      label: `does something related to ${c.clauseType}`,
      confidence: "high",
      oneSidedness: "high",
      dollarAmount: 500,
      noticeHours: null,
      noticeDays: null,
    }));
    const profile: RenterProfile = { state: "CA", pets: false, redLines: ["hidden fees", "auto-renewal"] };
    const report = await run(text, [{ id: "a", text, readable: true }], profile, flags);
    const view = buildReportView(report, profile);

    expect(view.disclaimer).toBe(report.disclaimer);
    expect(view.disclaimer.length).toBeGreaterThan(0);
    expect(view.largelyStandard).toBe(false);
    expect(view.suggestions).toEqual([]);
    expect(view.verdict).toBe("risks-found");
    expect(view.profileRows).toEqual([
      { label: "State", value: "CA" },
      { label: "Pets", value: "No" },
      { label: "Red lines", value: "hidden fees; auto-renewal" },
    ]);
    expect(view.unansweredFields).toEqual(["joint lease", "renter type"]);
  });
});
