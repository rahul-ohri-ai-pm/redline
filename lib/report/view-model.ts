/**
 * Pure view-model for the report screen. It only rearranges a saved Report:
 * no model call, no rewording. Summaries, source sentences and counter-offers
 * pass through exactly as the engine returned them.
 */

import { orderRiskFlags } from "../analysis/ranking";
import type { ActionBucket, ClauseType, Report, ReportVerdict, RiskFlag } from "../analysis/types";
import { BUCKET_LABEL, VERDICT_LABEL } from "../library/labels";

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

export interface ReportView {
  verdict: ReportVerdict;
  verdictLabel: string;
  summary: string;
  disclaimer: string;
  /** Always three entries, in screen order, zeros included. */
  tallies: BucketTally[];
  /** Only buckets that have flags, in screen order. */
  groups: BucketGroup[];
  totalFlags: number;
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

export function buildReportView(report: Report): ReportView {
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

  return {
    verdict: report.verdict,
    verdictLabel: VERDICT_LABEL[report.verdict],
    summary: report.verdictMessage,
    disclaimer: report.disclaimer,
    tallies,
    groups,
    totalFlags: ordered.length,
  };
}
