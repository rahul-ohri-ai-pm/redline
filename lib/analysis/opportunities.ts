/**
 * Opportunity flags (ADR 0006, ADR 0010) — advisory suggestions surfaced
 * when risk flags are few or absent. Deliberately NOT model-generated:
 * every suggestion here is a deterministic, documented check of whether
 * the document text already contains a specific renter-favorable
 * protection, grounded in the state-standard data. That keeps opportunity
 * flags real (they vary with input, they're not a canned list) without
 * requiring a second model round-trip or inventing a citation
 * requirement ADR 0010 explicitly rejects.
 *
 * Threshold for "few or absent" (documented per the ticket's request):
 * this module is only invoked by the engine when there are zero verified
 * risk flags. The spec's own example threshold is "zero or below some
 * small count"; zero was chosen to keep the boundary unambiguous — a
 * lease with even one confirmed risk flag already has a "risks-found"
 * report to act on, and diluting it with advisory suggestions risks
 * burying the real finding.
 */

import type { StateStandard } from "../state-standards";
import type { OpportunityFlag, RenterProfile } from "./types";

interface OpportunityCheck {
  id: string;
  /** Returns true when the document is missing this favorable term (i.e.
   * the opportunity applies) — false when the document already has it. */
  applies: (text: string, stateStandard: StateStandard | undefined, profile: RenterProfile) => boolean;
  suggestion: string;
}

const CHECKS: OpportunityCheck[] = [
  {
    id: "deposit-itemization",
    applies: (text) => !/itemiz/i.test(text),
    suggestion:
      "You could ask the landlord to commit in writing to an itemized accounting of any security-deposit deduction, even if the lease doesn't already promise one.",
  },
  {
    id: "entry-notice-window",
    // Proxy for "an hours-based notice period is specified somewhere in
    // the document" — deliberately not anchored to one exact phrasing,
    // since leases word this many ways; both words present is treated as
    // the document already naming a concrete notice window.
    applies: (text) => !(/notice/i.test(text) && /\bhours?\b/i.test(text)),
    suggestion:
      "You could ask the landlord to add a specific advance-notice window (in hours) for non-emergency entry, so it isn't left to their discretion.",
  },
  {
    id: "renewal-rent-cap",
    applies: (text) => !/(rent (will not|shall not|won't) increase|same rent)/i.test(text),
    suggestion:
      "You could ask the landlord to commit now to a cap on any rent increase at renewal, rather than leaving the renewed rent open-ended.",
  },
  {
    id: "late-fee-grace-period",
    applies: (text) => /late fee/i.test(text) && !/grace period/i.test(text),
    suggestion:
      "You could ask for a short grace period (a few days) before any late fee applies, rather than it kicking in the day rent is due.",
  },
  {
    id: "pet-deposit-refundable",
    applies: (text, _standard, profile) =>
      profile.pets === true && /pet deposit/i.test(text) && !/refundable/i.test(text),
    suggestion:
      "Since you have a pet, you could ask for the pet deposit to be explicitly refundable, the same as the standard security deposit.",
  },
];

export function deriveOpportunityFlags(
  text: string,
  stateStandard: StateStandard | undefined,
  renterProfile: RenterProfile
): OpportunityFlag[] {
  return CHECKS.filter((check) => check.applies(text, stateStandard, renterProfile)).map(
    (check) => ({ id: check.id, suggestion: check.suggestion })
  );
}
