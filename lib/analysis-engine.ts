/**
 * The analysis engine seam: `analyzeDocument(text, sections, renterProfile)
 * → Report`, described in `.scratch/lease-analysis-engine/spec.md`.
 *
 * This is the single public entry point. It orchestrates, in order:
 *
 * 1. Split sections into readable/skipped (ADR 0009) — skipped sections
 *    are excluded from everything sent to the model and always surfaced.
 * 2. Call the model (via `lib/openrouter.ts`'s `callModel`) with only the
 *    readable content, asking for structured candidate flags.
 * 3. Verify every candidate's citation against the source text (ADR
 *    0001) — this is a blocking check; a flag that fails is dropped here
 *    and never constructed into a `RiskFlag`.
 * 4. Assign each verified flag's action bucket (ADR 0003/0004), draft a
 *    counter-offer for remove-modify flags only, and compose
 *    confidence-calibrated wording (ADR 0005).
 * 5. Run the relevance filter and danger ranking (ADR 0004).
 * 6. When there are zero risk flags, derive opportunity flags (ADR 0006);
 *    when there are none of those either, the report is the bare
 *    "largely standard" verdict.
 * 7. Attach the skipped-sections list and standing disclaimer to every
 *    report, unconditionally.
 */

import { callModel, type CallModelDeps } from "./openrouter";
import { getStateStandard } from "./state-standards";
import { assignBucket } from "./analysis/buckets";
import { verifyCitation } from "./analysis/citation";
import { draftCounterOffer } from "./analysis/counter-offer";
import { buildVerdictMessage, DISCLAIMER_TEXT } from "./analysis/copy";
import { buildAnalysisMessages, FLAGS_JSON_SCHEMA, parseModelResponse } from "./analysis/model";
import { deriveOpportunityFlags } from "./analysis/opportunities";
import { isRelevant, orderRiskFlags } from "./analysis/ranking";
import {
  isReadableSection,
  type OpportunityFlag,
  type RenterProfile,
  type Report,
  type RiskFlag,
  type Section,
  type SkippedSection,
} from "./analysis/types";
import { composeFlagSummary } from "./analysis/wording";

export type {
  ActionBucket,
  ClarifyFlag,
  ModelConfidence,
  OneSidedness,
  OpportunityFlag,
  PushOnFlag,
  ReadableSection,
  RemoveModifyFlag,
  RenterProfile,
  Report,
  ReportVerdict,
  RiskFlag,
  Section,
  SkippedSection,
  UnreadableSection,
} from "./analysis/types";

export interface AnalyzeDocumentDeps {
  /** Forwarded to `callModel` — tests use this to stub the fetch used
   * under the hood without a real network call or API key. */
  callModelDeps?: CallModelDeps;
}

let flagCounter = 0;
function nextFlagId(prefix: string): string {
  flagCounter += 1;
  return `${prefix}-${flagCounter}`;
}

export async function analyzeDocument(
  text: string,
  sections: Section[],
  renterProfile: RenterProfile,
  deps: AnalyzeDocumentDeps = {}
): Promise<Report> {
  const readableSections = sections.filter(isReadableSection);
  const skippedSections: SkippedSection[] = sections
    .filter((section) => !section.readable)
    .map((section) => ({ id: section.id, reason: section.reason }));

  const stateStandard = getStateStandard(renterProfile.state);

  // Sections marked unreadable are excluded entirely from what's sent to
  // the model — never passed as content, never guessed at (ADR 0009).
  const contentForModel =
    sections.length > 0 ? readableSections.map((s) => s.text).join("\n\n") : text;

  const rawResponse = await callModel(
    {
      messages: buildAnalysisMessages(contentForModel, renterProfile, stateStandard),
      jsonSchema: FLAGS_JSON_SCHEMA,
    },
    deps.callModelDeps
  );

  const candidates = parseModelResponse(rawResponse);

  // The blocking citation check (ADR 0001): a candidate whose claimed
  // source sentence isn't a verbatim substring of the input text (or of a
  // readable section) is dropped here and never becomes a RiskFlag.
  const verifiedCandidates = candidates.filter((candidate) =>
    verifyCitation(candidate.sourceSentence, text, sections)
  );

  const riskFlags: RiskFlag[] = verifiedCandidates.map((candidate) => {
    const bucket = assignBucket(candidate, stateStandard);
    const relevant = isRelevant(
      candidate.clauseType,
      `${candidate.label} ${candidate.sourceSentence}`,
      renterProfile
    );
    const summary = composeFlagSummary(candidate.confidence, candidate.label);

    const base = {
      id: nextFlagId(candidate.clauseType),
      clauseType: candidate.clauseType,
      sourceSentence: candidate.sourceSentence,
      confidence: candidate.confidence,
      summary,
      relevant,
    };

    if (bucket === "remove-modify") {
      return {
        ...base,
        bucket,
        counterOffer: draftCounterOffer(
          candidate.clauseType,
          candidate.sourceSentence,
          stateStandard
        ),
      };
    }

    return { ...base, bucket };
  });

  const orderedRiskFlags = orderRiskFlags(riskFlags);

  // Opportunity flags only come into play when risk flags are genuinely
  // absent (see lib/analysis/opportunities.ts for the documented
  // "few or absent" threshold).
  let opportunityFlags: OpportunityFlag[] = [];
  if (orderedRiskFlags.length === 0) {
    opportunityFlags = deriveOpportunityFlags(contentForModel, stateStandard, renterProfile);
  }

  const verdict =
    orderedRiskFlags.length > 0
      ? "risks-found"
      : opportunityFlags.length > 0
      ? "opportunities-found"
      : "largely-standard";

  return {
    verdict,
    riskFlags: orderedRiskFlags,
    opportunityFlags,
    skippedSections,
    disclaimer: DISCLAIMER_TEXT,
    verdictMessage: buildVerdictMessage(verdict, renterProfile.state),
  };
}
