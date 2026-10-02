/**
 * Reading saved documents back out of the library. No model is involved
 * anywhere in this file: a saved report is shown as it was saved, after its
 * citations are checked again against the stored text (CLAUDE.md's invariant).
 */

import { verifyCitation } from "../analysis/citation";
import type { ActionBucket, RenterProfile, Report, ReportVerdict, RiskFlag } from "../analysis/types";
import type { DocumentStore, SavedDocument } from "../documents/types";

export interface LibraryEntry {
  id: string;
  title: string;
  createdAt: string;
  /** Two-letter state the document was analyzed against. */
  state: string;
  verdict: ReportVerdict;
  /** Risk flags per action bucket, for the compact tallies. */
  tallies: Record<ActionBucket, number>;
}

export type BlockerLogger = (message: string, detail: Record<string, unknown>) => void;

/** Blocker-level log line. The prefix is what an alert or a grep looks for. */
export const defaultBlockerLogger: BlockerLogger = (message, detail) => {
  console.error(`BLOCKER: ${message}`, detail);
};

export type LoadReportResult =
  | { ok: true; document: SavedDocument; report: Report }
  | { ok: false; reason: "not-found" | "citation-failed" | "load-failed" };

function tally(flags: RiskFlag[]): Record<ActionBucket, number> {
  const out: Record<ActionBucket, number> = { clarify: 0, "push-on": 0, "remove-modify": 0 };
  for (const f of flags) if (f.bucket in out) out[f.bucket] += 1;
  return out;
}

/** The signed-in user's documents, newest first. */
export async function listLibrary(store: DocumentStore, userId: string): Promise<LibraryEntry[]> {
  const docs = await store.list(userId);
  return docs
    .map((d) => ({
      id: d.id,
      title: d.title,
      createdAt: d.createdAt,
      state: d.profileSnapshot?.state ?? "",
      verdict: d.report.verdict,
      tallies: tally(d.report.riskFlags ?? []),
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Fetches one saved document for this user and re-runs citation
 * verification on every risk flag against the stored text. Any failure
 * returns `{ ok: false }` and nothing of the report, so a caller cannot
 * render a partial one. Opportunity flags have no citation (ADR 0010).
 */
export async function loadReport(
  store: DocumentStore,
  userId: string,
  id: string,
  logger: BlockerLogger = defaultBlockerLogger,
): Promise<LoadReportResult> {
  let document: SavedDocument | null;
  try {
    document = await store.get(userId, id);
  } catch {
    return { ok: false, reason: "load-failed" };
  }
  if (!document) return { ok: false, reason: "not-found" };

  const report = document.report;
  if (!report || !Array.isArray(report.riskFlags)) {
    logger("saved report is malformed and was not rendered", { documentId: id });
    return { ok: false, reason: "citation-failed" };
  }
  for (const flag of report.riskFlags) {
    if (!verifyCitation(flag?.sourceSentence, document.extractedText, document.sections ?? [])) {
      logger("risk flag source sentence is not in the stored text; report not rendered", {
        documentId: id,
        flagId: flag?.id,
      });
      return { ok: false, reason: "citation-failed" };
    }
  }
  return { ok: true, document, report };
}

/** Optional profile answers that were never given, named for the precision note. */
export function unansweredProfileFields(profile: RenterProfile): string[] {
  const out: string[] = [];
  if (profile.pets === undefined) out.push("pets");
  if (profile.jointLease === undefined) out.push("joint lease");
  if (profile.renterType === undefined) out.push("renter type");
  return out;
}
