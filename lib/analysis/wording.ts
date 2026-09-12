/**
 * Confidence-calibrated flag wording (ADR 0005). A flag's phrasing must
 * actually change with the model's per-flag certainty — hedged ("may",
 * "could", "might") when uncertain, stated flatly when clear-cut. This is
 * a small pure function so it's directly testable without going through
 * the whole engine or a stubbed model call.
 */

import type { ModelConfidence } from "./types";

/**
 * `label` is a short verb-phrase description of what the clause does,
 * e.g. "lets the landlord keep the deposit for any reason, without an
 * itemized accounting". It's combined with confidence-appropriate framing
 * to produce the flag's user-facing summary text.
 */
export function composeFlagSummary(
  confidence: ModelConfidence,
  label: string
): string {
  const body = label.trim().replace(/\.+$/, "");

  switch (confidence) {
    case "high":
      return `This clause ${body}.`;
    case "medium":
      return `This clause may ${body} — worth confirming with the landlord before you sign.`;
    case "low":
      return `Worth a closer look: the wording here could mean this clause ${body}, though it isn't fully clear from the text alone.`;
    default: {
      // Exhaustiveness guard: ModelConfidence is a closed union, so this
      // branch is unreachable at compile time but keeps runtime callers
      // (e.g. an unvalidated model response) from silently producing an
      // uncalibrated flag.
      const _exhaustive: never = confidence;
      throw new Error(`Unknown confidence level: ${String(_exhaustive)}`);
    }
  }
}
