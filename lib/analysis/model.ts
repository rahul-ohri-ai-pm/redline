/**
 * The model-interaction boundary for the analysis engine: prompt
 * construction, the JSON schema requested from `callModel`, and parsing
 * of the raw model response into validated candidate flags.
 *
 * Nothing here calls a model directly — it only builds the request for,
 * and interprets the response from, `lib/openrouter.ts`'s `callModel`,
 * per CLAUDE.md's settled stack decision.
 */

import type { ChatMessage, JsonSchemaSpec } from "../openrouter";
import type { StateStandard } from "../state-standards";
import type { ClauseType, ModelConfidence, OneSidedness, RenterProfile } from "./types";

const CLAUSE_TYPES: ClauseType[] = [
  "hidden-fee",
  "auto-renewal",
  "deposit-deduction",
  "early-termination",
  "right-of-entry",
  "guest-restriction",
  "unusual",
];

const CONFIDENCE_LEVELS: ModelConfidence[] = ["low", "medium", "high"];
const ONE_SIDEDNESS_LEVELS: OneSidedness[] = ["low", "medium", "high"];

/** A single flagged clause as returned (and validated) from the model. */
export interface ModelFlagCandidate {
  clauseType: ClauseType;
  /** Must be copied verbatim from the document — checked by `verifyCitation`. */
  sourceSentence: string;
  /** Short verb-phrase description of what the clause does, e.g. "lets
   * the landlord keep the deposit for any reason". */
  label: string;
  confidence: ModelConfidence;
  oneSidedness: OneSidedness;
  dollarAmount: number | null;
  noticeHours: number | null;
  noticeDays: number | null;
}

export const FLAGS_JSON_SCHEMA: JsonSchemaSpec = {
  name: "lease_risk_flags",
  schema: {
    type: "object",
    properties: {
      flags: {
        type: "array",
        items: {
          type: "object",
          properties: {
            clauseType: { type: "string", enum: CLAUSE_TYPES },
            sourceSentence: { type: "string" },
            label: { type: "string" },
            confidence: { type: "string", enum: CONFIDENCE_LEVELS },
            oneSidedness: { type: "string", enum: ONE_SIDEDNESS_LEVELS },
            dollarAmount: { type: ["number", "null"] },
            noticeHours: { type: ["number", "null"] },
            noticeDays: { type: ["number", "null"] },
          },
          required: [
            "clauseType",
            "sourceSentence",
            "label",
            "confidence",
            "oneSidedness",
            "dollarAmount",
            "noticeHours",
            "noticeDays",
          ],
          additionalProperties: false,
        },
      },
    },
    required: ["flags"],
    additionalProperties: false,
  },
  strict: true,
};

export function buildAnalysisMessages(
  content: string,
  renterProfile: RenterProfile,
  stateStandard: StateStandard | undefined
): ChatMessage[] {
  const profileLines = [
    `State: ${renterProfile.state}`,
    renterProfile.pets !== undefined ? `Has pets: ${renterProfile.pets}` : null,
    renterProfile.jointLease !== undefined
      ? `Joint lease: ${renterProfile.jointLease}`
      : null,
    renterProfile.renterType ? `Renter type: ${renterProfile.renterType}` : null,
    renterProfile.redLines && renterProfile.redLines.length > 0
      ? `Renter's own red lines: ${renterProfile.redLines.join("; ")}`
      : null,
  ].filter((line): line is string => line !== null);

  const stateStandardLines = stateStandard
    ? [
        `Deposit cap: ${
          stateStandard.depositCap.maxMonthsRent === null
            ? "no statutory cap"
            : `${stateStandard.depositCap.maxMonthsRent} month(s) rent`
        }`,
        `Landlord entry notice minimum: ${stateStandard.noticePeriods.landlordEntryHours} hours`,
        `Lease termination notice minimum: ${stateStandard.noticePeriods.leaseTerminationDays} days`,
      ]
    : ["No state-standard reference data available for this state."];

  const systemMessage: ChatMessage = {
    role: "system",
    content:
      "You are a lease-review assistant for a renter (never the landlord). " +
      "Find clauses of these types: hidden/wallet-impacting fees, auto-renewal, " +
      "security-deposit deduction terms, early-termination penalties, landlord's " +
      "right of entry, guest restrictions, and anything else non-standard " +
      '("unusual"). For every flag, copy the exact sentence it is based on ' +
      "verbatim from the supplied text — do not paraphrase or summarize the " +
      "source sentence. When a clause is borderline, still flag it rather than " +
      "staying silent, and reflect your uncertainty honestly in the confidence field.",
  };

  const userMessage: ChatMessage = {
    role: "user",
    content: [
      "Renter profile:",
      ...profileLines,
      "",
      "State-standard reference data:",
      ...stateStandardLines,
      "",
      "Document text to analyze (only readable sections are included):",
      content,
    ].join("\n"),
  };

  return [systemMessage, userMessage];
}

/**
 * Validates and normalizes the raw model response into candidate flags.
 * Malformed entries (missing required fields, an unrecognized enum value)
 * are dropped rather than allowed to crash the pipeline or silently
 * become an unverified flag — the citation check downstream is the real
 * safety net, but garbage-in should not even reach it.
 */
export function parseModelResponse(payload: unknown): ModelFlagCandidate[] {
  if (typeof payload !== "object" || payload === null) return [];
  const flags = (payload as Record<string, unknown>).flags;
  if (!Array.isArray(flags)) return [];

  const candidates: ModelFlagCandidate[] = [];
  for (const raw of flags) {
    const candidate = normalizeCandidate(raw);
    if (candidate) candidates.push(candidate);
  }
  return candidates;
}

function normalizeCandidate(raw: unknown): ModelFlagCandidate | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;

  if (typeof r.sourceSentence !== "string" || r.sourceSentence.length === 0) {
    return null;
  }
  if (typeof r.label !== "string" || r.label.length === 0) {
    return null;
  }

  const clauseType = CLAUSE_TYPES.includes(r.clauseType as ClauseType)
    ? (r.clauseType as ClauseType)
    : "unusual";
  const confidence = CONFIDENCE_LEVELS.includes(r.confidence as ModelConfidence)
    ? (r.confidence as ModelConfidence)
    : "low"; // unrecognized/missing confidence is treated as low, never dropped
  const oneSidedness = ONE_SIDEDNESS_LEVELS.includes(r.oneSidedness as OneSidedness)
    ? (r.oneSidedness as OneSidedness)
    : "medium";

  return {
    clauseType,
    sourceSentence: r.sourceSentence,
    label: r.label,
    confidence,
    oneSidedness,
    dollarAmount: typeof r.dollarAmount === "number" ? r.dollarAmount : null,
    noticeHours: typeof r.noticeHours === "number" ? r.noticeHours : null,
    noticeDays: typeof r.noticeDays === "number" ? r.noticeDays : null,
  };
}
