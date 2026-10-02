/**
 * Pure view-model for the report screen. It only rearranges a saved Report:
 * no model call, no rewording. Summaries, source sentences and counter-offers
 * pass through exactly as the engine returned them.
 */

import { orderRiskFlags } from "../analysis/ranking";
import { buildVerdictMessage } from "../analysis/copy";
import type {
  ActionBucket,
  ClauseType,
  RenterProfile,
  Report,
  ReportVerdict,
  RiskFlag,
  SkippedSection,
} from "../analysis/types";
import { BUCKET_LABEL, VERDICT_LABEL } from "../library/labels";
import { unansweredProfileFields } from "../library/load";

/** Screen order of the buckets (ADR 0003): the most demanding action first. */
export const BUCKET_ORDER: ActionBucket[] = ["remove-modify", "push-on", "clarify"];

export interface FlagView {
  id: string;
  bucket: ActionBucket;
  bucketLabel: string;
  clauseType: ClauseType;
  /** The engine's wording, unchanged. For push-on and clarify flags this is
   * the engine's ask or question; the engine returns no separate field. */
  summary: string;
  /** Verbatim from the parsed text. */
  sourceSentence: string;
  /** Present only on remove/modify flags. */
  counterOffer?: string;
  /** Failed the relevance filter. Still shown, drawn quieter. */
  deprioritized: boolean;
}

export interface BucketGroup {
  bucket: ActionBucket;
  label: string;
  flags: FlagView[];
}

export interface BucketTally {
  bucket: ActionBucket;
  label: string;
  count: number;
  /** How many of `count` are deprioritized. */
  deprioritized: number;
}

/** An opportunity suggestion. Deliberately has no source-sentence field:
 * suggestions are advice about what the document leaves out (ADR 0010). */
export interface SuggestionView {
  id: string;
  suggestion: string;
}

export interface ProfileRow {
  label: string;
  value: string;
}

export interface ReportView {
  /** Derived from the flags actually present; see `deriveVerdict`. */
  verdict: ReportVerdict;
  verdictLabel: string;
  summary: string;
  disclaimer: string;
  /** Always three entries, in screen order, zeros included. */
  tallies: BucketTally[];
  /** Only buckets that have flags, in screen order. */
  groups: BucketGroup[];
  totalFlags: number;
  /** Everything the parser could not read, as the engine returned it. */
  skipped: SkippedSection[];
  /** Optional profile answers never given (ADR 0007). Empty when no profile was passed. */
  unansweredFields: string[];
  /** Ready-to-show precision notice, or null when every optional answer exists. */
  precisionNote: string | null;
  suggestions: SuggestionView[];
  /** Answers the report ran against, in display order. Empty when no profile was passed. */
  profileRows: ProfileRow[];
  /** True only with zero risk flags AND zero suggestions AND the engine agreeing. */
  largelyStandard: boolean;
}

/**
 * The verdict the screen shows. It follows the flags, so "largely standard"
 * can never sit next to a flag or a suggestion (ADR 0006, story 40). The
 * engine never produces that mix itself; this guards a stored or hand-built
 * report. The engine's own "largely-standard" is never invented: with no
 * flags at all, the verdict is largely-standard only if the engine said so.
 */
export function deriveVerdict(report: Report): ReportVerdict {
  if (report.riskFlags.length > 0) return "risks-found";
  if (report.opportunityFlags.length > 0) return "opportunities-found";
  return report.verdict;
}

function profileRowsFor(profile: RenterProfile): ProfileRow[] {
  const yesNo = (v: boolean) => (v ? "Yes" : "No");
  const rows: ProfileRow[] = [{ label: "State", value: profile.state }];
  if (profile.pets !== undefined) rows.push({ label: "Pets", value: yesNo(profile.pets) });
  if (profile.jointLease !== undefined) rows.push({ label: "Joint lease", value: yesNo(profile.jointLease) });
  if (profile.renterType !== undefined) rows.push({ label: "Renter type", value: profile.renterType });
  if (profile.redLines && profile.redLines.length > 0) {
    rows.push({ label: "Red lines", value: profile.redLines.join("; ") });
  }
  return rows;
}

function toFlagView(flag: RiskFlag): FlagView {
  const view: FlagView = {
    id: flag.id,
    bucket: flag.bucket,
    bucketLabel: BUCKET_LABEL[flag.bucket],
    clauseType: flag.clauseType,
    summary: flag.summary,
    sourceSentence: flag.sourceSentence,
    deprioritized: !flag.relevant,
  };
  if (flag.bucket === "remove-modify") view.counterOffer = flag.counterOffer;
  return view;
}

export function buildReportView(report: Report, profile?: RenterProfile): ReportView {
  // Relevant first, then danger order (ADR 0004); grouping keeps that order.
  const ordered = orderRiskFlags(report.riskFlags).map(toFlagView);

  const groups: BucketGroup[] = [];
  const tallies: BucketTally[] = [];
  for (const bucket of BUCKET_ORDER) {
    const flags = ordered.filter((f) => f.bucket === bucket);
    tallies.push({
      bucket,
      label: BUCKET_LABEL[bucket],
      count: flags.length,
      deprioritized: flags.filter((f) => f.deprioritized).length,
    });
    if (flags.length > 0) groups.push({ bucket, label: BUCKET_LABEL[bucket], flags });
  }

  const verdict = deriveVerdict(report);
  const unansweredFields = profile ? unansweredProfileFields(profile) : [];

  return {
    verdict,
    verdictLabel: VERDICT_LABEL[verdict],
    // The engine's message belongs to the engine's verdict. If the shown
    // verdict differs, use the standing message for the shown one.
    summary:
      verdict === report.verdict
        ? report.verdictMessage
        : buildVerdictMessage(verdict, profile?.state ?? "your state"),
    disclaimer: report.disclaimer,
    tallies,
    groups,
    totalFlags: ordered.length,
    skipped: report.skippedSections.map((x) => ({ id: x.id, reason: x.reason })),
    unansweredFields,
    precisionNote:
      unansweredFields.length > 0
        ? `No answer was saved for ${unansweredFields.join(", ")}, so the relevance ordering is less precise.`
        : null,
    suggestions: report.opportunityFlags.map((o) => ({ id: o.id, suggestion: o.suggestion })),
    profileRows: profile ? profileRowsFor(profile) : [],
    largelyStandard: verdict === "largely-standard" && ordered.length === 0 && report.opportunityFlags.length === 0,
  };
}
