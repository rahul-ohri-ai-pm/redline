import type { Section } from "../analysis/types";

/** The body the browser sends. Nothing else is accepted. */
export interface AnalyzeRequestBody {
  text: string;
  sections: Section[];
  title: string;
}

export function buildAnalyzeBody(input: AnalyzeRequestBody): AnalyzeRequestBody {
  return { text: input.text, sections: input.sections, title: input.title };
}
