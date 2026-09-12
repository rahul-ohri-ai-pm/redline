/**
 * Standing report copy (ADR 0006). Kept separate from the orchestration
 * logic so the wording can be reviewed/edited on its own — this is
 * user-facing text, so it's written in plain language on purpose rather
 * than legal boilerplate, even though (per CLAUDE.md) it doesn't need to
 * go through the humanizer skill since it isn't landing-page/UI copy.
 */

import type { ReportVerdict } from "./types";

export const DISCLAIMER_TEXT =
  "Redline isn't a lawyer, and this isn't legal advice — it's a starting point for a conversation with your landlord. If this lease is a big commitment for you, it's worth having an actual attorney look at it too.";

export function buildVerdictMessage(verdict: ReportVerdict, state: string): string {
  switch (verdict) {
    case "risks-found":
      return "Here's what stood out in your lease, ranked by what matters most.";
    case "opportunities-found":
      return `Nothing serious stood out in this lease, but there are a few things you could still ask for — here they are.`;
    case "largely-standard":
      return `This lease looks largely standard for ${state} — nothing stood out enough to flag or suggest changing.`;
    default: {
      const _exhaustive: never = verdict;
      throw new Error(`Unknown report verdict: ${String(_exhaustive)}`);
    }
  }
}
