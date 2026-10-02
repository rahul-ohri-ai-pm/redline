/**
 * The orchestration point that sits above the analysis seam. Anything that
 * would call `analyzeDocument` goes through here, so a refused or unchecked
 * document can never reach it. Later steps reuse this function.
 */

import { analyzeDocument } from "../analysis-engine";
import type { RenterProfile, Report, Section } from "../analysis/types";
import { classifyDocument } from "./classify";
import type { GateOutcome } from "./types";

export type GatedAnalysis =
  | { status: "analyzed"; report: Report }
  | Exclude<GateOutcome, { status: "pass" }>;

export interface GatedAnalysisDeps {
  classify?: (text: string) => Promise<GateOutcome>;
  analyze?: typeof analyzeDocument;
}

export async function runAnalysisIfLease(
  text: string,
  sections: Section[],
  renterProfile: RenterProfile,
  deps: GatedAnalysisDeps = {}
): Promise<GatedAnalysis> {
  const classify = deps.classify ?? ((t: string) => classifyDocument(t));
  const analyze = deps.analyze ?? analyzeDocument;
  const gate = await classify(text);
  if (gate.status !== "pass") return gate;
  return { status: "analyzed", report: await analyze(text, sections, renterProfile) };
}
