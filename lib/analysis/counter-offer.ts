/**
 * Drafted counter-offers for remove-modify flags only (ADR 0003). Plain
 * text, referencing the specific clause, one per clause type — the
 * catch-all ("unusual") falls back to a generic ask that still quotes the
 * clause's own source sentence so it reads as specific rather than
 * boilerplate.
 */

import type { StateStandard } from "../state-standards";
import type { ClauseType } from "./types";

export function draftCounterOffer(
  clauseType: ClauseType,
  sourceSentence: string,
  stateStandard: StateStandard | undefined
): string {
  switch (clauseType) {
    case "hidden-fee":
      return "Ask the landlord to remove this fee, or fold it into the stated monthly rent, so the real monthly cost is disclosed up front instead of billed separately.";
    case "auto-renewal":
      return "Ask the landlord to replace the automatic-renewal language with a lease that simply ends on its stated date unless both sides agree in writing to a new term.";
    case "deposit-deduction":
      return "Ask the landlord to limit deductions to unpaid rent and damage beyond normal wear and tear, and to require a written, itemized accounting of any amount withheld, instead of leaving deductions to sole discretion.";
    case "early-termination":
      return "Ask the landlord to cap early-termination liability at a set lease-break fee and to require a good-faith effort to re-rent the unit, instead of the full remaining balance regardless of how quickly it's re-rented.";
    case "right-of-entry": {
      const hours = stateStandard?.noticePeriods.landlordEntryHours;
      const noticeAsk =
        typeof hours === "number" && hours > 0
          ? `at least ${hours} hours'`
          : "reasonable advance";
      return `Ask the landlord to require ${noticeAsk} written notice before entering, except in genuine emergencies.`;
    }
    case "guest-restriction":
      return "Ask the landlord to raise the guest-stay threshold and drop the added-occupant fee for ordinary, infrequent guest stays.";
    default:
      return `Ask the landlord to remove or rewrite this clause — "${sourceSentence}" — so it doesn't place all of the risk on you.`;
  }
}
