/**
 * Relevance-then-danger ordering (ADR 0004). The relevance filter runs
 * first and is the primary sort key; danger rank is the secondary key
 * within each relevance group. Flags that fail relevance are never
 * dropped — they're sorted after relevant ones (ADR 0004's consequences:
 * "still need to be shown somewhere, not silently dropped").
 */

import type { ClauseType, RenterProfile, RiskFlag } from "./types";

/** Danger order for clauses that pass the relevance filter (CONTEXT.md,
 * PRD.md's "My red lines"): hidden/wallet-impacting fees first, down to
 * "unusual" last, unranked among itself. */
const DANGER_ORDER: ClauseType[] = [
  "hidden-fee",
  "auto-renewal",
  "deposit-deduction",
  "early-termination",
  "right-of-entry",
  "guest-restriction",
  "unusual",
];

export function dangerRankOf(clauseType: ClauseType): number {
  const index = DANGER_ORDER.indexOf(clauseType);
  return index === -1 ? DANGER_ORDER.length : index;
}

/**
 * Relevance filter. Concretely, in v1, "relevance to the renter's actual
 * situation" means two documented checks against the renter profile:
 *
 * 1. Pets: if the renter has explicitly said they have no pet
 *    (`pets === false`, not merely omitted), any flag whose text mentions
 *    a pet is deprioritized — a strict pet policy doesn't affect them.
 * 2. Guests: if the renter has given an explicit red-lines list (so we
 *    know what they said they care about, not just an absence of data)
 *    and none of those red lines mention guests, a guest-restriction flag
 *    is deprioritized — CONTEXT.md's own example.
 *
 * Everything else (jointLease, renterType, and clause types other than
 * the two above) is read but has no mapped relevance rule in v1 — there's
 * no clean, non-arbitrary signal to deprioritize on for them without a
 * real accuracy target (spec.md explicitly puts judgment-quality
 * validation out of scope). Omitted profile fields never make a flag
 * *less* relevant by default — only an explicit, contradicting answer
 * does (ADR 0007: optional fields degrade precision, not availability).
 */
export function isRelevant(
  clauseType: ClauseType,
  flagText: string,
  renterProfile: RenterProfile
): boolean {
  const haystack = flagText.toLowerCase();

  if (renterProfile.pets === false && haystack.includes("pet")) {
    return false;
  }

  if (clauseType === "guest-restriction") {
    const redLines = renterProfile.redLines ?? [];
    if (redLines.length > 0) {
      const mentionsGuests = redLines.some((line) =>
        line.toLowerCase().includes("guest")
      );
      if (!mentionsGuests) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Sorts flags relevant-first, then by danger rank within each group.
 * Stable with respect to input order for flags that tie on both keys.
 */
export function orderRiskFlags(flags: RiskFlag[]): RiskFlag[] {
  return [...flags]
    .map((flag, index) => ({ flag, index }))
    .sort((a, b) => {
      if (a.flag.relevant !== b.flag.relevant) {
        return a.flag.relevant ? -1 : 1;
      }
      const rankDiff = dangerRankOf(a.flag.clauseType) - dangerRankOf(b.flag.clauseType);
      if (rankDiff !== 0) return rankDiff;
      return a.index - b.index;
    })
    .map(({ flag }) => flag);
}
