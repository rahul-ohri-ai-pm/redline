import { describe, expect, it } from "vitest";
import type { Report } from "../../analysis/types";
import { createMemoryDocumentStore } from "../../documents/memory-store";
import type { DocumentStore, NewDocument } from "../../documents/types";
import { deleteDocument, DELETE_FAILED_MESSAGE } from "../delete";
import { listLibrary, loadReport } from "../load";

const TEXT = "Tenant pays a $75 late fee.";

function doc(title: string): NewDocument {
  const report: Report = {
    verdict: "risks-found",
    riskFlags: [
      {
        id: "f1",
        clauseType: "hidden-fee",
        sourceSentence: TEXT,
        confidence: "high",
        summary: "s",
        relevant: true,
        bucket: "remove-modify",
        counterOffer: "Remove it.",
      },
    ],
    opportunityFlags: [],
    skippedSections: [],
    disclaimer: "Not legal advice.",
    verdictMessage: "msg",
  };
  return {
    title,
    extractedText: TEXT,
    sections: [{ id: "a", text: TEXT, readable: true }],
    profileSnapshot: { state: "CA" },
    report,
  };
}

const as = (id: string | null) => async () => (id ? { id } : null);

describe("deleteDocument", () => {
  it("removes the row with its text, sections, snapshot and report", async () => {
    const store = createMemoryDocumentStore();
    const saved = await store.insert("a", doc("Mine"));
    expect(await store.get("a", saved.id)).toMatchObject({ extractedText: TEXT });

    expect(await deleteDocument(saved.id, { getUser: as("a"), store })).toEqual({ ok: true });

    expect(await store.get("a", saved.id)).toBeNull();
    expect(await store.list("a")).toEqual([]);
  });

  it("drops the document from the list and makes it unopenable by id", async () => {
    const store = createMemoryDocumentStore();
    const keep = await store.insert("a", doc("Keep"));
    const gone = await store.insert("a", doc("Gone"));
    await deleteDocument(gone.id, { getUser: as("a"), store });

    expect((await listLibrary(store, "a")).map((e) => e.title)).toEqual(["Keep"]);
    expect(await loadReport(store, "a", gone.id)).toEqual({ ok: false, reason: "not-found" });
    expect((await loadReport(store, "a", keep.id)).ok).toBe(true);
  });

  it("does not let user A delete user B's document", async () => {
    const store = createMemoryDocumentStore();
    const b = await store.insert("b", doc("B's lease"));
    const result = await deleteDocument(b.id, { getUser: as("a"), store });
    expect(result).toMatchObject({ ok: false, reason: "not-found" });
    expect(await store.get("b", b.id)).toMatchObject({ title: "B's lease" });
  });

  it("refuses when signed out and leaves the row", async () => {
    const store = createMemoryDocumentStore();
    const saved = await store.insert("a", doc("Mine"));
    const result = await deleteDocument(saved.id, { getUser: as(null), store });
    expect(result).toMatchObject({ ok: false, reason: "signed-out" });
    expect(await store.get("a", saved.id)).not.toBeNull();
  });

  it("reports a failed delete and keeps the row", async () => {
    const inner = createMemoryDocumentStore();
    const saved = await inner.insert("a", doc("Mine"));
    const store: DocumentStore = {
      ...inner,
      remove: async () => {
        throw new Error("db down");
      },
    };
    const result = await deleteDocument(saved.id, { getUser: as("a"), store });
    expect(result).toEqual({ ok: false, reason: "failed", message: DELETE_FAILED_MESSAGE });
    expect(await inner.get("a", saved.id)).not.toBeNull();
  });

  it("reports not-found for an id that never existed", async () => {
    const store = createMemoryDocumentStore();
    expect(await deleteDocument("nope", { getUser: as("a"), store })).toMatchObject({
      ok: false,
      reason: "not-found",
    });
  });
});
