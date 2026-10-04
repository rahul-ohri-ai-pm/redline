import type { ActionBucket, ClauseType, ReportVerdict } from "../analysis/types";

export const VERDICT_LABEL: Record<ReportVerdict, string> = {
  "risks-found": "Risks found",
  "opportunities-found": "Things to ask for",
  "largely-standard": "Looks standard",
};

/** What a finding is about, for the head of a flag. Short noun phrases: these
 * sit in the tag's category slot, not in a sentence. */
export const CLAUSE_LABEL: Record<ClauseType, string> = {
  "hidden-fee": "Hidden fee",
  "auto-renewal": "Auto-renewal",
  "deposit-deduction": "Deposit deduction",
  "early-termination": "Early termination",
  "right-of-entry": "Right of entry",
  "guest-restriction": "Guest restriction",
  unusual: "Unusual term",
};

export const BUCKET_LABEL: Record<ActionBucket, string> = {
  clarify: "Clarify",
  "push-on": "Push on",
  "remove-modify": "Remove or modify",
};

export function formatSavedDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { dateStyle: "medium", timeZone: "UTC" });
}
