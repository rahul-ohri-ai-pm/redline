/**
 * Action-bucket assignment (ADR 0003, ADR 0004). Order of the gates:
 *
 * 1. Negotiability — is this clause realistically negotiable at all? A
 *    clause whose specific term matches what the renter's state already
 *    treats as standard/statutory is not negotiable, however one-sided it
 *    reads, and is downgraded to "clarify" (ask about it, don't spend
 *    leverage pushing on it).
 * 2. One-sidedness/irreversibility — high one-sidedness (and not a
 *    statutory match) becomes remove-modify; low becomes clarify.
 * 3. Dollar amount — tiebreaker for medium one-sidedness.
 *
 * The negotiability gate is real, state-data-driven logic (via
 * `getStateStandard`), not a hardcoded true/false — see
 * `matchesStateStandard` below for exactly what it checks per clause
 * type, and why.
 */

import type { StateStandard } from "../state-standards";
import type { ActionBucket, ClauseType, OneSidedness } from "./types";

export interface BucketInput {
  clauseType: ClauseType;
  oneSidedness: OneSidedness;
  /** A dollar figure the flag is about, if the model reported one
   * (e.g. a fee amount, a lease-break fee). Null/undefined when the
   * clause isn't primarily about a specific dollar figure. */
  dollarAmount?: number | null;
  /** For right-of-entry flags: the notice period (in hours) the clause
   * itself grants, if stated (0 for "no notice required"). */
  noticeHours?: number | null;
  /** For auto-renewal flags: the notice-to-vacate window (in days) the
   * clause requires from the tenant to prevent renewal, if stated. */
  noticeDays?: number | null;
}

/**
 * Real, per-clause-type comparisons against `getStateStandard` data.
 * Deliberately narrow: only clause types where the state-standard dataset
 * has a directly comparable field are checked; everything else always
 * returns false (i.e. "not proven standard, so negotiable"), which is the
 * safer default given the over-flag bias (ADR 0005) — silence about a
 * state rule should never be read as "this is fine."
 */
export function matchesStateStandard(
  input: BucketInput,
  stateStandard: StateStandard | undefined
): boolean {
  if (!stateStandard) return false;

  switch (input.clauseType) {
    case "right-of-entry": {
      // The clause is statutory-compliant (and so not worth pushing on)
      // only when the notice it actually grants meets or exceeds the
      // state's minimum. A "no notice required" clause (0 hours) in a
      // state with no entry-notice requirement (also 0) is a genuine
      // match; the same clause in a 24-hour-notice state is not.
      if (input.noticeHours == null) return false;
      return input.noticeHours >= stateStandard.noticePeriods.landlordEntryHours;
    }
    case "auto-renewal": {
      // The tenant's required notice-to-vacate window is statutory-typical
      // only when it's no longer than the state's own termination-notice
      // minimum. A window well beyond that (e.g. 90 days against a
      // 30-day state minimum) is landlord-favorable beyond what's
      // required, so it's still negotiable.
      if (input.noticeDays == null) return false;
      return input.noticeDays <= stateStandard.noticePeriods.leaseTerminationDays;
    }
    default:
      // deposit-deduction, early-termination, hidden-fee, guest-restriction,
      // and unusual have no directly comparable statutory field in the
      // fixture state-standard dataset (a discretion-to-deduct clause, for
      // instance, isn't the deposit-amount cap) — treated as always
      // negotiable rather than guessed at.
      return false;
  }
}

export function assignBucket(
  input: BucketInput,
  stateStandard: StateStandard | undefined
): ActionBucket {
  if (matchesStateStandard(input, stateStandard)) {
    return "clarify";
  }

  if (input.oneSidedness === "high") {
    return "remove-modify";
  }

  if (input.oneSidedness === "low") {
    return "clarify";
  }

  // Medium one-sidedness: dollar amount breaks the tie. $100+ treated as
  // material enough to warrant demanding a change rather than just
  // pushing on it.
  if (typeof input.dollarAmount === "number" && input.dollarAmount >= 100) {
    return "remove-modify";
  }

  return "push-on";
}
