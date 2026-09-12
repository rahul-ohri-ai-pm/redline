/**
 * State-standard reference data: deposit caps, notice-period minimums,
 * banned/restricted fee types, and typical amounts, per state.
 *
 * This is a data dependency both engine seams consume (see
 * `.scratch/lease-analysis-engine/spec.md`): the analysis engine reads it
 * for the negotiability gate (a clause matching a statutory minimum isn't
 * negotiable, however one-sided it feels) and for opportunity-flag framing
 * (suggesting something more favorable than the document's term but still
 * realistic); the Q&A engine reads it as a second grounding source
 * alongside the parsed document text (CONTEXT.md's "Q&A grounding").
 *
 * ---------------------------------------------------------------------
 * PLACEHOLDER DATA — NOT LEGALLY AUTHORITATIVE.
 *
 * The fixture data in `stateStandards` below is fabricated to be
 * internally consistent and realistic in shape, so downstream tickets
 * (03, 04) aren't blocked on sourcing a real dataset. It is NOT sourced
 * from any state's actual statutes and must never be shown to a user as
 * verified legal fact. Sourcing/building the real production dataset is
 * a separate, future ticket (see spec.md's "Further Notes" and "Out of
 * Scope").
 * ---------------------------------------------------------------------
 */

/** Two-letter USPS state code, e.g. "CA", "NY", "TX". */
export type StateCode = string;

/**
 * The security deposit cap for a state. `maxMonthsRent` is `null` when the
 * state imposes no statutory cap (callers must not treat `null` as "0" or
 * as "unknown" — it specifically means "no cap exists").
 */
export interface DepositCap {
  /** Maximum deposit expressed as a multiple of monthly rent, or null if uncapped. */
  maxMonthsRent: number | null;
  /** Free-text notes on how the cap is calculated (e.g. pet deposits, furnished units). */
  notes: string;
}

/**
 * Notice-period minimums. Landlord-entry notice and lease-termination /
 * non-renewal notice are governed by different rules in most states and
 * must be kept distinct — conflating them would misinform both the
 * negotiability gate and Q&A answers.
 */
export interface NoticePeriods {
  /** Minimum notice (in hours) a landlord must give before entering the unit. */
  landlordEntryHours: number;
  /** Minimum notice (in days) either party must give to terminate or not renew the lease. */
  leaseTerminationDays: number;
}

/** A fee type a state bans or restricts landlords from charging. */
export interface BannedFee {
  /** Short machine-friendly identifier, e.g. "credit-check-fee-cap". */
  id: string;
  /** Human-readable description of what's banned or restricted. */
  description: string;
}

/**
 * Typical/reasonable amounts for terms that aren't hard-capped by statute.
 * These back opportunity-flag framing ("landlords in your state typically
 * charge X") and Q&A answers about what's normal, as distinct from what's
 * legally required.
 */
export interface TypicalAmounts {
  /** Typical late fee cap, in whole US dollars. Null if no typical figure applies. */
  lateFeeCapUsd: number | null;
  /** Typical security deposit, expressed as a multiple of monthly rent. */
  typicalDepositMonthsRent: number;
}

export interface StateStandard {
  state: StateCode;
  depositCap: DepositCap;
  noticePeriods: NoticePeriods;
  bannedFees: BannedFee[];
  typicalAmounts: TypicalAmounts;
}

/**
 * Fixture state-standard data, keyed by two-letter state code.
 *
 * Chosen states deliberately exercise different code paths:
 * - CA: strict deposit cap, a banned fee type present.
 * - TX: no statutory deposit cap at all (`maxMonthsRent: null`), no banned fees.
 * - NY: a mid-strictness cap, a different banned fee type, longer termination notice.
 *
 * See the module-level PLACEHOLDER DATA notice above — none of this is
 * sourced from real statutes.
 */
export const stateStandards: Record<StateCode, StateStandard> = {
  CA: {
    state: "CA",
    depositCap: {
      maxMonthsRent: 1,
      notes:
        "Fixture: capped at 1 month's rent for unfurnished units regardless of pets; furnished units are not distinguished in this fixture.",
    },
    noticePeriods: {
      landlordEntryHours: 24,
      leaseTerminationDays: 30,
    },
    bannedFees: [
      {
        id: "credit-check-fee-cap",
        description:
          "Fixture: application/credit-check fees above a small fixed amount are restricted.",
      },
    ],
    typicalAmounts: {
      lateFeeCapUsd: 50,
      typicalDepositMonthsRent: 1,
    },
  },
  TX: {
    state: "TX",
    depositCap: {
      maxMonthsRent: null,
      notes:
        "Fixture: no statutory maximum on security deposit amount; landlords set their own.",
    },
    noticePeriods: {
      landlordEntryHours: 0,
      leaseTerminationDays: 30,
    },
    bannedFees: [],
    typicalAmounts: {
      lateFeeCapUsd: null,
      typicalDepositMonthsRent: 1,
    },
  },
  NY: {
    state: "NY",
    depositCap: {
      maxMonthsRent: 1,
      notes:
        "Fixture: capped at 1 month's rent; deposit must be held in an interest-bearing account for buildings above a unit-count threshold (not modeled in this fixture).",
    },
    noticePeriods: {
      landlordEntryHours: 24,
      leaseTerminationDays: 60,
    },
    bannedFees: [
      {
        id: "broker-fee-passthrough",
        description:
          "Fixture: certain broker-fee pass-throughs to tenants are restricted.",
      },
    ],
    typicalAmounts: {
      lateFeeCapUsd: 50,
      typicalDepositMonthsRent: 1,
    },
  },
};

/**
 * Looks up state-standard data for a state code.
 *
 * Contract: returns `undefined` for a state not present in the dataset
 * (unlisted or unrecognized code) rather than throwing — callers (the
 * negotiability gate, opportunity-flag framing, Q&A grounding) must treat
 * "no data for this state" as a distinct, handled case, not an error.
 * Lookup is case-insensitive; codes are normalized to uppercase.
 */
export function getStateStandard(
  state: StateCode
): StateStandard | undefined {
  return stateStandards[state.toUpperCase()];
}
