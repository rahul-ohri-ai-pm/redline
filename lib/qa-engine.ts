/**
 * The Q&A engine seam: answers a renter's question about their lease,
 * grounded only in the document's own text or the state-standard
 * reference data (see `docs/adr/0008-qa-box-grounding.md`), and refuses
 * explicitly — never a guess, never silence — when a question needs
 * anything else (verbal agreements, hypotheticals, "should I sign
 * this"-style advice).
 *
 * This is a separate, independently-tested seam from the analysis engine
 * (`lib/analysis-engine.ts` / ticket 03) per `.scratch/lease-analysis-engine
 * /spec.md`'s "Testing Decisions" — it shares only the `RenterProfile` type
 * (a plain data shape, not a fixture or test dependency) with the analysis
 * engine, and does not import or depend on its fixtures or sidecar files.
 */

import { callModel, type CallModelDeps } from "./openrouter";
import type { StateStandard } from "./state-standards";
import type { RenterProfile } from "./analysis/types";

export type { RenterProfile };

export type GroundedIn = "document" | "state-standard" | "both";

export interface Answer {
  kind: "answer";
  /** The answer text shown to the renter. */
  text: string;
  /** Which source(s) the answer is grounded in. */
  groundedIn: GroundedIn;
  /**
   * Verbatim sentence(s) quoted from the input `text`, present whenever
   * `groundedIn` is `"document"` or `"both"`. Every entry here has been
   * verified as an exact substring of the source text before this Answer
   * is returned — an unverified citation is never surfaced.
   */
  sourceSentences?: string[];
}

export type RefusalReason =
  | "outside-document-and-state-standard"
  | "general-advice-not-grounded"
  | "citation-could-not-be-verified"
  | "state-standard-unavailable"
  | "model-response-invalid";

export interface Refusal {
  kind: "refusal";
  reason: RefusalReason;
  /** Renter-facing text. Reads as a clear boundary, never a hedge. */
  text: string;
}

export type QaResult = Answer | Refusal;

const REFUSAL_TEXT =
  "I can't answer that from your document or state data. Redline only answers questions your lease text or your state's reference data actually settles — this one needs something else, so I won't guess.";

const GENERAL_ADVICE_REFUSAL_TEXT =
  "I can't answer that. Redline points out what your lease says and how it compares to state standards, but it doesn't give an opinion on what you personally should do — that call (and any \"should I sign this\" judgment) isn't something a source can back up.";

/** Shape of the model's structured response, as requested via jsonSchema. */
interface ModelQaResponse {
  grounding: "document" | "state-standard" | "both" | "none";
  isGeneralAdvice: boolean;
  answer: string;
  sourceSentences: string[];
}

function isModelQaResponse(value: unknown): value is ModelQaResponse {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (
    v.grounding !== "document" &&
    v.grounding !== "state-standard" &&
    v.grounding !== "both" &&
    v.grounding !== "none"
  ) {
    return false;
  }
  if (typeof v.isGeneralAdvice !== "boolean") return false;
  if (typeof v.answer !== "string") return false;
  if (!Array.isArray(v.sourceSentences)) return false;
  if (!v.sourceSentences.every((s) => typeof s === "string")) return false;
  return true;
}

const QA_JSON_SCHEMA = {
  name: "qa_answer",
  schema: {
    type: "object",
    properties: {
      grounding: {
        type: "string",
        enum: ["document", "state-standard", "both", "none"],
        description:
          "Which source(s) actually support the answer. Use 'none' when the " +
          "question needs facts or reasoning outside both the document text " +
          "and the provided state-standard data, including general advice or " +
          "opinion questions (e.g. 'should I sign this').",
      },
      isGeneralAdvice: {
        type: "boolean",
        description:
          "True if the question is asking for an opinion, recommendation, or " +
          "general legal advice (e.g. 'should I sign this', 'what should I do') " +
          "rather than a fact from the document or state data.",
      },
      answer: {
        type: "string",
        description:
          "The answer text. If grounding is 'none', a short explanation of why " +
          "it can't be answered is fine here; the caller supplies the final " +
          "renter-facing refusal wording itself.",
      },
      sourceSentences: {
        type: "array",
        items: { type: "string" },
        description:
          "Verbatim sentence(s) copied exactly from the supplied document text " +
          "that support the answer. Empty array if grounding is 'state-standard' " +
          "or 'none'.",
      },
    },
    required: ["grounding", "isGeneralAdvice", "answer", "sourceSentences"],
    additionalProperties: false,
  },
};

function buildStateStandardSummary(stateStandard: StateStandard): string {
  const lines = [
    `State: ${stateStandard.state}`,
    `Security deposit cap: ${
      stateStandard.depositCap.maxMonthsRent === null
        ? "no statutory cap"
        : `${stateStandard.depositCap.maxMonthsRent} month(s) rent`
    } (${stateStandard.depositCap.notes})`,
    `Landlord entry notice: ${stateStandard.noticePeriods.landlordEntryHours} hours minimum`,
    `Lease termination notice: ${stateStandard.noticePeriods.leaseTerminationDays} days minimum`,
    `Banned/restricted fees: ${
      stateStandard.bannedFees.length === 0
        ? "none on file"
        : stateStandard.bannedFees
            .map((f) => `${f.id} — ${f.description}`)
            .join("; ")
    }`,
    `Typical late fee cap: ${
      stateStandard.typicalAmounts.lateFeeCapUsd === null
        ? "no typical figure on file"
        : `$${stateStandard.typicalAmounts.lateFeeCapUsd}`
    }`,
    `Typical security deposit: ${stateStandard.typicalAmounts.typicalDepositMonthsRent} month(s) rent`,
  ];
  return lines.join("\n");
}

/**
 * Verifies every claimed source sentence is an exact, verbatim substring of
 * the source document text. Whitespace-only differences at the edges are
 * tolerated (the model may trim); the sentence itself must match exactly.
 */
function verifyCitations(sentences: string[], text: string): boolean {
  if (sentences.length === 0) return false;
  return sentences.every((sentence) => {
    const trimmed = sentence.trim();
    if (trimmed.length === 0) return false;
    return text.includes(trimmed);
  });
}

/**
 * Answers a renter's question about their lease, grounded only in the
 * document text or state-standard reference data, refusing explicitly
 * when neither source settles it.
 */
export async function answerQuestion(
  text: string,
  stateStandard: StateStandard | undefined,
  renterProfile: RenterProfile,
  question: string,
  deps: CallModelDeps = {}
): Promise<QaResult> {
  const stateStandardSummary = stateStandard
    ? buildStateStandardSummary(stateStandard)
    : `No state-standard reference data is available for state "${renterProfile.state}".`;

  const systemPrompt = [
    "You answer a renter's question about their lease using ONLY two sources:",
    "1. The exact lease document text supplied below.",
    "2. The state-standard reference data supplied below.",
    "",
    "Rules:",
    "- Never use outside knowledge, assumptions, or general legal knowledge not present in the two sources.",
    "- Never answer verbal-agreement claims, hypotheticals, or facts the document does not state.",
    "- Never give an opinion, recommendation, or general advice (e.g. 'should I sign this', 'what should I do'). Classify these as isGeneralAdvice=true and grounding='none'.",
    "- If the document text answers the question, quote the exact supporting sentence(s) verbatim in sourceSentences, copied character-for-character from the document text — do not paraphrase or fix typos.",
    "- If the state-standard data answers the question (e.g. comparing a document term to what's normal/allowed in the renter's state), set grounding to 'state-standard' (or 'both' if the document text is also directly quoted).",
    "- If neither source settles the question, set grounding to 'none'.",
    "",
    "Respond only with the requested JSON.",
  ].join("\n");

  const userPrompt = [
    `Renter's state: ${renterProfile.state}`,
    "",
    "=== STATE-STANDARD REFERENCE DATA ===",
    stateStandardSummary,
    "",
    "=== LEASE DOCUMENT TEXT ===",
    text,
    "",
    "=== QUESTION ===",
    question,
  ].join("\n");

  const raw = await callModel(
    {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      jsonSchema: QA_JSON_SCHEMA,
    },
    deps
  );

  if (!isModelQaResponse(raw)) {
    return {
      kind: "refusal",
      reason: "model-response-invalid",
      text: REFUSAL_TEXT,
    };
  }

  if (raw.isGeneralAdvice) {
    return {
      kind: "refusal",
      reason: "general-advice-not-grounded",
      text: GENERAL_ADVICE_REFUSAL_TEXT,
    };
  }

  if (raw.grounding === "none") {
    return {
      kind: "refusal",
      reason: "outside-document-and-state-standard",
      text: REFUSAL_TEXT,
    };
  }

  if (raw.grounding === "state-standard" || raw.grounding === "both") {
    // We only ever offer state-standard data to the model when it exists;
    // a claim of state-standard grounding without data behind it is
    // treated as ungrounded, never trusted at face value.
    if (!stateStandard) {
      return {
        kind: "refusal",
        reason: "state-standard-unavailable",
        text: REFUSAL_TEXT,
      };
    }
  }

  if (raw.grounding === "document" || raw.grounding === "both") {
    const verified = verifyCitations(raw.sourceSentences, text);
    if (!verified) {
      return {
        kind: "refusal",
        reason: "citation-could-not-be-verified",
        text: REFUSAL_TEXT,
      };
    }
  }

  const groundedIn: GroundedIn =
    raw.grounding === "both"
      ? "both"
      : raw.grounding === "document"
        ? "document"
        : "state-standard";

  const answer: Answer = {
    kind: "answer",
    text: raw.answer,
    groundedIn,
  };

  if (groundedIn === "document" || groundedIn === "both") {
    answer.sourceSentences = raw.sourceSentences.map((s) => s.trim());
  }

  return answer;
}
