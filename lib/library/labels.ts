import type { ActionBucket, ReportVerdict } from "../analysis/types";

export const VERDICT_LABEL: Record<ReportVerdict, string> = {
  "risks-found": "Risks found",
  "opportunities-found": "Things to ask for",
  "largely-standard": "Looks standard",
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
