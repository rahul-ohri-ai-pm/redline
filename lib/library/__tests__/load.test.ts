import { describe, expect, it, vi } from "vitest";
import type { Report, RiskFlag } from "../../analysis/types";
import { createMemoryDocumentStore } from "../../documents/memory-store";
import type { NewDocument } from "../../documents/types";
import { listLibrary, loadReport, unansweredProfileFields } from "../load";

const TEXT = "Tenant pays a $75 late fee. Landlord may enter at any time.";

function flag(id: string, bucket: RiskFlag["bucket"], sentence: string): RiskFlag {
  const base = {
    id,
    clauseType: "hidden-fee" as const,
    sourceSentence: sentence,
    confidence: "high" as const,
    summary: "s",
    relevant: true,
  };
  return bucket === "remove-modify"
    ? { ...base, bucket, counterOffer: "Ask for it to be removed." }
    : { ...base, bucket };
}

function doc(title: string, flags: RiskFlag[], state = "CA"): NewDocument {
  const report: Report = {
    verdict: flags.length ? "risks-found" : "largely-standard",
    riskFlags: flags,
    opportunityFlags: [{ id: "o1", suggestion: "You could ask for X." }],
    skippedSections: [{ id: "p3", reason: "scanned page" }],
    disclaimer: "Not legal advice.",
    verdictMessage: "msg",
  };
  return {
    title,
    extractedText: TEXT,
    sections: [{ id: "a", text: TEXT, readable: true }],
    profileSnapshot: { state },
    report,
  };
}

const good = () => [
  flag("f1", "remove-modify", "Tenant pays a $75 late fee."),
  flag("f2", "clarify", "Landlord may enter at any time."),
];

describe("library list", () => {
  it("is empty for a user with no documents", async () => {
    expect(await listLibrary(createMemoryDocumentStore(), "u1")).toEqual([]);
  });

  it("lists newest first with title, date, state, verdict and bucket tallies", async () => {
    const store = createMemoryDocumentStore();
    await store.insert("u1", doc("First", good(), "CA"));
    await store.insert("u1", doc("Second", [], "TX"));
    const list = await listLibrary(store, "u1");
    expect(list.map((e) => e.title)).toEqual(["Second", "First"]);
    expect(list[0]).toMatchObject({ state: "TX", verdict: "largely-standard" });
    expect(list[1].tallies).toEqual({ clarify: 1, "push-on": 0, "remove-modify": 1 });
    expect(list[1].createdAt).toMatch(/^2026-/);
  });

  it("shows only the signed-in user's documents", async () => {
    const store = createMemoryDocumentStore();
    await store.insert("u1", doc("Mine", good()));
    await store.insert("u2", doc("Theirs", good()));
    expect((await listLibrary(store, "u1")).map((e) => e.title)).toEqual(["Mine"]);
    expect((await listLibrary(store, "u2")).map((e) => e.title)).toEqual(["Theirs"]);
  });
});

describe("loadReport", () => {
  it("returns the saved report as saved, with no model call", async () => {
    const store = createMemoryDocumentStore();
    const saved = await store.insert("u1", doc("Lease", good()));
    // loadReport takes no model; a global fetch that throws proves no network call is made.
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(() => {
      throw new Error("model called");
    });
    const logger = vi.fn();
    const res = await loadReport(store, "u1", saved.id, logger);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.report.riskFlags.map((f) => f.sourceSentence)).toEqual([
      "Tenant pays a $75 late fee.",
      "Landlord may enter at any time.",
    ]);
    expect(res.report.skippedSections).toEqual([{ id: "p3", reason: "scanned page" }]);
    expect(res.report.disclaimer).toBe("Not legal advice.");
    expect(res.document.profileSnapshot.state).toBe("CA");
    expect(logger).not.toHaveBeenCalled();
  });

  it("blocks rendering and logs a blocker when a stored sentence no longer matches", async () => {
    const store = createMemoryDocumentStore();
    const bad = good();
    bad[1] = flag("f2", "clarify", "Landlord may enter at any time!");
    const saved = await store.insert("u1", doc("Corrupt", bad));
    const logger = vi.fn();
    const res = await loadReport(store, "u1", saved.id, logger);
    expect(res).toEqual({ ok: false, reason: "citation-failed" });
    expect(logger).toHaveBeenCalledTimes(1);
    expect(logger.mock.calls[0][1]).toMatchObject({ documentId: saved.id, flagId: "f2" });
  });

  it("default logger writes a BLOCKER-prefixed console.error", async () => {
    const store = createMemoryDocumentStore();
    const saved = await store.insert("u1", doc("Corrupt", [flag("f1", "clarify", "not in text")]));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    await loadReport(store, "u1", saved.id);
    expect(spy.mock.calls[0][0]).toMatch(/^BLOCKER/);
    spy.mockRestore();
  });

  it("does not verify opportunity flags, which have no citation", async () => {
    const store = createMemoryDocumentStore();
    const saved = await store.insert("u1", doc("Clean", []));
    expect((await loadReport(store, "u1", saved.id)).ok).toBe(true);
  });

  it("does not find another user's document", async () => {
    const store = createMemoryDocumentStore();
    const saved = await store.insert("u2", doc("Theirs", good()));
    expect(await loadReport(store, "u1", saved.id)).toEqual({ ok: false, reason: "not-found" });
    expect(await loadReport(store, "u1", "no-such-id")).toEqual({ ok: false, reason: "not-found" });
  });

  it("reports a store failure as load-failed, not as missing", async () => {
    const store = createMemoryDocumentStore();
    store.get = async () => {
      throw new Error("db down");
    };
    expect(await loadReport(store, "u1", "x")).toEqual({ ok: false, reason: "load-failed" });
  });
});

describe("unansweredProfileFields", () => {
  it("names optional answers that were never given", () => {
    expect(unansweredProfileFields({ state: "CA" })).toEqual(["pets", "joint lease", "renter type"]);
    expect(
      unansweredProfileFields({ state: "CA", pets: false, jointLease: false, renterType: "individual" }),
    ).toEqual([]);
  });
});
