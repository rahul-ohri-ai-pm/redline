/**
 * Shared types for the analysis engine (`lib/analysis-engine.ts`).
 *
 * These mirror the vocabulary in `CONTEXT.md` and the shapes described in
 * `.scratch/lease-analysis-engine/spec.md`: action buckets, the relevance
 * filter, opportunity flags, and partial extraction.
 */

/** The six ranked clause types from PRD.md's "My red lines", plus the
 * catch-all "unusual" bucket for anything else non-standard. Order here
 * is NOT the danger order — see `DANGER_ORDER` in `ranking.ts`. */
export type ClauseType =
  | "hidden-fee"
  | "auto-renewal"
  | "deposit-deduction"
  | "early-termination"
  | "right-of-entry"
  | "guest-restriction"
  | "unusual";

/** The model's self-reported certainty about a single flag. Drives the
 * hedged-vs-flat wording (ADR 0005) but never whether the flag is dropped —
 * over-flag bias means confidence is never a filter, only a tone input. */
export type ModelConfidence = "low" | "medium" | "high";

/** How one-sided/irreversible the clause is, as the model assesses it.
 * Feeds bucket assignment as the second gate, after negotiability
 * (ADR 0004). */
export type OneSidedness = "low" | "medium" | "high";

/** The three action buckets (ADR 0003). Only `remove-modify` carries a
 * counter-offer — enforced structurally by `RiskFlag` below, not by
 * convention. */
export type ActionBucket = "clarify" | "push-on" | "remove-modify";

/**
 * A readable section of the parsed document. `text` is always a non-null
 * string here — the discriminant is what makes `UnreadableSection`'s
 * `text: null` impossible to accidentally read as content.
 */
export interface ReadableSection {
  id: string;
  text: string;
  readable: true;
}

/**
 * A section the client-side parser could not confidently read. `text` is
 * always `null` — callers must never guess at or synthesize text for one
 * of these (ADR 0009). `reason` is surfaced to the renter verbatim in the
 * report's `skippedSections` list.
 */
export interface UnreadableSection {
  id: string;
  text: null;
  readable: false;
  reason: string;
}

export type Section = ReadableSection | UnreadableSection;

/** Narrows a `Section` to `ReadableSection`. */
export function isReadableSection(section: Section): section is ReadableSection {
  return section.readable === true;
}

/**
 * The renter's saved profile (ADR 0007). `state` is the only required
 * field — it's the first bucket-assignment gate (negotiability, via
 * `getStateStandard`). Everything else is optional and only sharpens the
 * relevance filter; omitting it degrades precision, not availability.
 */
export interface RenterProfile {
  /** Two-letter state code, e.g. "CA". Required — analysis cannot run without it. */
  state: string;
  /** Whether the renter has a pet. Undefined means "not provided", distinct from false. */
  pets?: boolean;
  jointLease?: boolean;
  /** Free-text renter type, e.g. "individual", "roommate", "co-signer". */
  renterType?: string;
  /** The renter's own red-line clause descriptions (CLAUDE.md's "editable
   * list of the user's own red lines"), free text, used to sharpen relevance. */
  redLines?: string[];
}

/** A page/section the parser couldn't confidently read, surfaced in the report. */
export interface SkippedSection {
  id: string;
  reason: string;
}

interface RiskFlagBase {
  id: string;
  clauseType: ClauseType;
  /** The exact sentence this flag is based on — verified verbatim against
   * the input text/sections before the flag is ever constructed. See
   * `verifyCitation` in `citation.ts`. */
  sourceSentence: string;
  confidence: ModelConfidence;
  /** Confidence-calibrated wording — see `composeFlagSummary` in `wording.ts`. */
  summary: string;
  /** Whether this flag passed the renter-profile relevance filter. Flags
   * that fail are still included (never silently dropped, per ADR 0004's
   * consequences) but sorted after relevant ones. */
  relevant: boolean;
}

export interface ClarifyFlag extends RiskFlagBase {
  bucket: "clarify";
}

export interface PushOnFlag extends RiskFlagBase {
  bucket: "push-on";
}

export interface RemoveModifyFlag extends RiskFlagBase {
  bucket: "remove-modify";
  /** Plain-text drafted counter-offer. Only remove-modify flags carry one —
   * this is a discriminated union, not an optional field on a shared shape,
   * so a clarify/push-on flag structurally cannot have a counterOffer. */
  counterOffer: string;
}

/** A risk flag: something already in the document that's dangerous. */
export type RiskFlag = ClarifyFlag | PushOnFlag | RemoveModifyFlag;

/**
 * An opportunity flag: a favorable term the renter could ask for that
 * ISN'T in the document, or a way a fine clause could be improved further.
 * Deliberately a distinct type from RiskFlag with no `sourceSentence`
 * field at all (ADR 0010) — there is nothing to cite, and the absence of
 * the field (not just an empty string) is what makes it impossible to
 * confuse an opportunity flag for a risk flag in code.
 */
export interface OpportunityFlag {
  id: string;
  /** Low-commitment, general suggestion text (ADR 0010's "you could ask for X"). */
  suggestion: string;
}

/** The three possible report shapes (ADR 0006), told apart by `verdict`. */
export type ReportVerdict = "risks-found" | "opportunities-found" | "largely-standard";

export interface Report {
  verdict: ReportVerdict;
  riskFlags: RiskFlag[];
  opportunityFlags: OpportunityFlag[];
  /** Always present, even when empty — every section the parser skipped,
   * on every code path (ADR 0009). */
  skippedSections: SkippedSection[];
  /** Standing "not legal advice" disclaimer. Present on every report,
   * unconditionally (ADR 0006) — there is no code path that omits it. */
  disclaimer: string;
  /** Plain-English framing for the current verdict — most useful in the
   * `largely-standard` case, where it IS the report, but present on every
   * verdict for consistent rendering. */
  verdictMessage: string;
}
