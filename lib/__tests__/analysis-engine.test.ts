import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { analyzeDocument, type RenterProfile, type Section } from "../analysis-engine";
import type { FetchLike } from "../openrouter";

const FIXTURES_DIR = path.resolve(process.cwd(), "tests/fixtures");

function readFixture(name: string): string {
  return readFileSync(path.join(FIXTURES_DIR, name), "utf-8");
}

function readJsonFixture<T>(name: string): T {
  return JSON.parse(readFixture(name)) as T;
}

interface SidecarClause {
  clauseType: string;
  sourceSentence: string;
  expectedSeverity: "high" | "medium" | "low";
}

/** Builds a canned OpenRouter-shaped success response, following the same
 * pattern as lib/__tests__/openrouter.test.ts. */
function okResponse(content: string): ReturnType<FetchLike> extends Promise<infer T> ? T : never {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: "stop" }],
    }),
    text: async () => content,
  } as never;
}

/** Maps a sidecar's expected severity into the model-response fields our
 * engine consumes (confidence, oneSidedness) — the fixture only records
 * severity, so this is the one place a test translates it into the
 * engine's input vocabulary. */
function severityToModelFields(severity: SidecarClause["expectedSeverity"]) {
  if (severity === "high") return { confidence: "high" as const, oneSidedness: "high" as const };
  if (severity === "medium") return { confidence: "high" as const, oneSidedness: "medium" as const };
  return { confidence: "high" as const, oneSidedness: "low" as const };
}

function candidateFromSidecar(clause: SidecarClause, overrides: Record<string, unknown> = {}) {
  const { confidence, oneSidedness } = severityToModelFields(clause.expectedSeverity);
  return {
    clauseType: clause.clauseType,
    sourceSentence: clause.sourceSentence,
    label: `does something related to ${clause.clauseType}`,
    confidence,
    oneSidedness,
    dollarAmount: 500,
    noticeHours: null,
    noticeDays: clause.clauseType === "auto-renewal" ? 90 : null,
    ...overrides,
  };
}

function stubFetchReturning(payload: unknown): FetchLike {
  return async () => okResponse(JSON.stringify(payload));
}

const CA_PROFILE: RenterProfile = { state: "CA" };

describe("analyzeDocument — adhesion lease (risk flags)", () => {
  const text = readFixture("adhesion-lease.txt");
  const sidecar = readJsonFixture<{ clauses: SidecarClause[] }>(
    "adhesion-lease.sidecar.json"
  );

  it("returns a verified risk flag for every planted clause, each citing its real source sentence", async () => {
    const flags = sidecar.clauses.map((c) => candidateFromSidecar(c));
    const fetchFn = stubFetchReturning({ flags });

    const report = await analyzeDocument(text, [], CA_PROFILE, {
      callModelDeps: { fetchFn, apiKey: "test-key", model: "test/model" },
    });

    expect(report.verdict).toBe("risks-found");
    expect(report.riskFlags).toHaveLength(sidecar.clauses.length);

    for (const flag of report.riskFlags) {
      // The single most important structural property: every flag's
      // citation is a real, verbatim substring of the fixture text.
      expect(text.includes(flag.sourceSentence)).toBe(true);
    }

    const sourceSentences = report.riskFlags.map((f) => f.sourceSentence);
    for (const clause of sidecar.clauses) {
      expect(sourceSentences).toContain(clause.sourceSentence);
    }
  });

  it("gives every flag exactly one bucket, and only remove-modify flags carry a counter-offer", async () => {
    const flags = sidecar.clauses.map((c) => candidateFromSidecar(c));
    const fetchFn = stubFetchReturning({ flags });

    const report = await analyzeDocument(text, [], CA_PROFILE, {
      callModelDeps: { fetchFn, apiKey: "test-key", model: "test/model" },
    });

    for (const flag of report.riskFlags) {
      expect(["clarify", "push-on", "remove-modify"]).toContain(flag.bucket);
      if (flag.bucket === "remove-modify") {
        expect(typeof flag.counterOffer).toBe("string");
        expect(flag.counterOffer.length).toBeGreaterThan(0);
      } else {
        expect((flag as { counterOffer?: unknown }).counterOffer).toBeUndefined();
      }
    }

    // The high-severity, highly one-sided planted clauses should have
    // reached remove-modify given our fixture's confidence/oneSidedness mapping.
    const removeModifyClauseTypes = report.riskFlags
      .filter((f) => f.bucket === "remove-modify")
      .map((f) => f.clauseType);
    expect(removeModifyClauseTypes).toContain("hidden-fee");
    expect(removeModifyClauseTypes).toContain("deposit-deduction");
  });

  it("orders flags by danger rank: hidden fee before auto-renewal before guest-restriction", async () => {
    const flags = sidecar.clauses.map((c) => candidateFromSidecar(c));
    const fetchFn = stubFetchReturning({ flags });

    const report = await analyzeDocument(text, [], CA_PROFILE, {
      callModelDeps: { fetchFn, apiKey: "test-key", model: "test/model" },
    });

    const order = report.riskFlags.map((f) => f.clauseType);
    expect(order.indexOf("hidden-fee")).toBeLessThan(order.indexOf("auto-renewal"));
    expect(order.indexOf("auto-renewal")).toBeLessThan(order.indexOf("deposit-deduction"));
    expect(order.indexOf("deposit-deduction")).toBeLessThan(order.indexOf("early-termination"));
    expect(order.indexOf("early-termination")).toBeLessThan(order.indexOf("right-of-entry"));
    expect(order.indexOf("right-of-entry")).toBeLessThan(order.indexOf("guest-restriction"));
  });

  it("deprioritizes a guest-restriction flag when the renter's red lines don't mention guests", async () => {
    const flags = sidecar.clauses.map((c) => candidateFromSidecar(c));
    const fetchFn = stubFetchReturning({ flags });

    const profileWithUnrelatedRedLines: RenterProfile = {
      state: "CA",
      redLines: ["hidden fees", "auto-renewal"],
    };

    const report = await analyzeDocument(text, [], profileWithUnrelatedRedLines, {
      callModelDeps: { fetchFn, apiKey: "test-key", model: "test/model" },
    });

    const guestFlag = report.riskFlags.find((f) => f.clauseType === "guest-restriction");
    expect(guestFlag).toBeDefined();
    expect(guestFlag?.relevant).toBe(false);

    // Deprioritized means sorted after every relevant flag, not dropped.
    const guestIndex = report.riskFlags.findIndex((f) => f.clauseType === "guest-restriction");
    expect(guestIndex).toBe(report.riskFlags.length - 1);
  });

  it("drops a flag whose claimed source sentence is fabricated and never appears in the document", async () => {
    const realClause = sidecar.clauses[0];
    const fabricatedFlag = {
      ...candidateFromSidecar(realClause),
      clauseType: "unusual",
      sourceSentence:
        "Tenant is granted a lifetime supply of free parking spaces at no cost whatsoever.",
      label: "grants free parking for life",
    };

    const fetchFn = stubFetchReturning({ flags: [fabricatedFlag] });

    const report = await analyzeDocument(text, [], CA_PROFILE, {
      callModelDeps: { fetchFn, apiKey: "test-key", model: "test/model" },
    });

    // The fabricated flag must never reach the report.
    const sentences = report.riskFlags.map((f) => f.sourceSentence);
    expect(sentences).not.toContain(fabricatedFlag.sourceSentence);
    expect(report.riskFlags).toHaveLength(0);

    // With zero verified risk flags, the engine falls through to the
    // opportunity/bare-verdict path rather than reporting a bogus risk.
    expect(report.verdict).not.toBe("risks-found");
  });

  it("still includes a medium-confidence flag, hedged, rather than dropping it (over-flag bias)", async () => {
    const clause = sidecar.clauses.find((c) => c.clauseType === "guest-restriction")!;
    const mediumFlag = candidateFromSidecar(clause, {
      confidence: "medium",
      oneSidedness: "medium",
      dollarAmount: 20,
      label: "may require an added-occupant fee for extra guests",
    });

    const fetchFn = stubFetchReturning({ flags: [mediumFlag] });

    const report = await analyzeDocument(text, [], CA_PROFILE, {
      callModelDeps: { fetchFn, apiKey: "test-key", model: "test/model" },
    });

    expect(report.riskFlags).toHaveLength(1);
    const flag = report.riskFlags[0];
    expect(flag.confidence).toBe("medium");
    expect(flag.summary).toMatch(/\b(may|might|could)\b/i);
  });

  it("never sends a section marked unreadable to the model as content", async () => {
    let capturedBody: Record<string, unknown> = {};
    const capturingFetch: FetchLike = async (url, init) => {
      capturedBody = JSON.parse((init as { body: string }).body);
      return okResponse(JSON.stringify({ flags: [] }));
    };

    const sections: Section[] = [
      { id: "s1", readable: true, text: "1. TERM. Standard term clause." },
      {
        id: "s2",
        readable: false,
        text: null,
        reason: "garbled OCR-like text or corrupted characters",
      },
    ];

    await analyzeDocument("1. TERM. Standard term clause.", sections, CA_PROFILE, {
      callModelDeps: { fetchFn: capturingFetch, apiKey: "test-key", model: "test/model" },
    });

    const messages = (capturedBody.messages as Array<{ content: string }>) ?? [];
    const combined = messages.map((m) => m.content).join("\n");
    expect(combined).not.toContain("garbled");
    expect(combined).toContain("Standard term clause");
  });
});

describe("analyzeDocument — clean lease (opportunity flags / bare verdict)", () => {
  const text = readFixture("clean-lease.txt");

  it("returns opportunity flags, not risk flags, when the model finds nothing wrong", async () => {
    const fetchFn = stubFetchReturning({ flags: [] });

    const report = await analyzeDocument(text, [], CA_PROFILE, {
      callModelDeps: { fetchFn, apiKey: "test-key", model: "test/model" },
    });

    expect(report.riskFlags).toHaveLength(0);
    expect(report.verdict).toBe("opportunities-found");
    expect(report.opportunityFlags.length).toBeGreaterThan(0);
    for (const opportunity of report.opportunityFlags) {
      expect(opportunity).not.toHaveProperty("sourceSentence");
      expect(typeof opportunity.suggestion).toBe("string");
    }
  });

  it("returns the bare largely-standard verdict when a document already covers every opportunity check", async () => {
    const alreadyFavorableText = [
      "RESIDENTIAL LEASE AGREEMENT",
      "The security deposit will be returned with an itemized written statement of any deduction.",
      "Landlord will provide at least 24 hours notice before entering the unit for inspection.",
      "The rent will not increase at renewal.",
      "A late fee applies after a five-day grace period following the due date.",
    ].join(" ");

    const fetchFn = stubFetchReturning({ flags: [] });

    const report = await analyzeDocument(alreadyFavorableText, [], CA_PROFILE, {
      callModelDeps: { fetchFn, apiKey: "test-key", model: "test/model" },
    });

    expect(report.riskFlags).toHaveLength(0);
    expect(report.opportunityFlags).toHaveLength(0);
    expect(report.verdict).toBe("largely-standard");
  });

  it("includes the disclaimer on the opportunity-flags report", async () => {
    const fetchFn = stubFetchReturning({ flags: [] });
    const report = await analyzeDocument(text, [], CA_PROFILE, {
      callModelDeps: { fetchFn, apiKey: "test-key", model: "test/model" },
    });
    expect(report.disclaimer.length).toBeGreaterThan(0);
  });
});

describe("analyzeDocument — disclaimer presence across every report shape", () => {
  it("is present on the risk-flags report", async () => {
    const sidecar = readJsonFixture<{ clauses: SidecarClause[] }>(
      "adhesion-lease.sidecar.json"
    );
    const text = readFixture("adhesion-lease.txt");
    const flags = sidecar.clauses.map((c) => candidateFromSidecar(c));
    const fetchFn = stubFetchReturning({ flags });

    const report = await analyzeDocument(text, [], CA_PROFILE, {
      callModelDeps: { fetchFn, apiKey: "test-key", model: "test/model" },
    });

    expect(report.verdict).toBe("risks-found");
    expect(report.disclaimer).toBe(
      "Redline isn't a lawyer, and this isn't legal advice — it's a starting point for a conversation with your landlord. If this lease is a big commitment for you, it's worth having an actual attorney look at it too."
    );
  });

  it("is present on the bare largely-standard report", async () => {
    const alreadyFavorableText = [
      "The security deposit will be returned with an itemized written statement of any deduction.",
      "Landlord will provide at least 24 hours notice before entering the unit for inspection.",
      "The rent will not increase at renewal.",
      "A late fee applies after a five-day grace period following the due date.",
    ].join(" ");
    const fetchFn = stubFetchReturning({ flags: [] });

    const report = await analyzeDocument(alreadyFavorableText, [], CA_PROFILE, {
      callModelDeps: { fetchFn, apiKey: "test-key", model: "test/model" },
    });

    expect(report.verdict).toBe("largely-standard");
    expect(report.disclaimer.length).toBeGreaterThan(0);
  });
});

describe("analyzeDocument — partial extraction (skipped sections)", () => {
  const text = readFixture("partial-extraction-lease.txt");
  const sections = readJsonFixture<Section[]>("partial-extraction-lease.sections.json");

  it("surfaces the unreadable section in skippedSections, and still produces flags from readable sections", async () => {
    interface RawSection {
      id: string;
      text: string | null;
      readable: boolean;
      plantedClauseType?: string;
    }
    const rawSections = sections as unknown as RawSection[];
    const readableWithPlantedClause = rawSections.filter(
      (s) => s.readable === true && typeof s.plantedClauseType === "string"
    );

    const flags = readableWithPlantedClause.map((section) => ({
      // Use the section's own text — a real substring of the document —
      // as the source sentence, so the citation check is exercised for
      // real rather than asserted against itself.
      clauseType: section.plantedClauseType,
      sourceSentence: section.text as string,
      label: "does something notable",
      confidence: "high",
      oneSidedness: "high",
      dollarAmount: 500,
      noticeHours: null,
      noticeDays: null,
    }));

    const fetchFn = stubFetchReturning({ flags });

    const report = await analyzeDocument(text, sections, CA_PROFILE, {
      callModelDeps: { fetchFn, apiKey: "test-key", model: "test/model" },
    });

    expect(report.skippedSections).toHaveLength(1);
    expect(report.skippedSections[0].id).toBe("sec-5-renewal");
    expect(report.skippedSections[0].reason).toContain("garbled");

    // Flags from the readable sections still come through.
    expect(report.riskFlags.length).toBe(readableWithPlantedClause.length);
    for (const flag of report.riskFlags) {
      expect(text.includes(flag.sourceSentence)).toBe(true);
    }
  });

  it("always includes skippedSections, even when there is nothing else to report", async () => {
    const fetchFn = stubFetchReturning({ flags: [] });

    const report = await analyzeDocument(text, sections, CA_PROFILE, {
      callModelDeps: { fetchFn, apiKey: "test-key", model: "test/model" },
    });

    expect(report.skippedSections).toHaveLength(1);
    expect(report.skippedSections[0].id).toBe("sec-5-renewal");
  });
});
