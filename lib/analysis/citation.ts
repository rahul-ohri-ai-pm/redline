/**
 * The blocking citation check (ADR 0001). A risk flag whose claimed
 * source sentence can't be found, verbatim, in the parsed text is a bug —
 * this module is what turns that rule into an automated gate the engine
 * runs before a flag is ever allowed into a `Report`, not a soft
 * assertion left to eyeballing or to tests.
 */

import type { Section } from "./types";
import { isReadableSection } from "./types";

/**
 * Returns true only if `sourceSentence` is an exact substring of the full
 * document text, or of at least one readable section's text. This is a
 * plain substring check — no trimming, no fuzzy/normalized matching — by
 * design: ADR 0001 requires the sentence to be verbatim, and a fuzzy match
 * would silently reintroduce the "citation pointing at misread text" risk
 * that OCR was excluded from scope to avoid.
 *
 * Checking against readable sections in addition to the full `text` lets
 * callers verify citations that came from a per-section model call even
 * when `text` itself wasn't reassembled from just the readable sections.
 */
export function verifyCitation(
  sourceSentence: string,
  text: string,
  sections: Section[] = []
): boolean {
  if (typeof sourceSentence !== "string" || sourceSentence.length === 0) {
    return false;
  }
  if (text.includes(sourceSentence)) {
    return true;
  }
  return sections.some(
    (section) => isReadableSection(section) && section.text.includes(sourceSentence)
  );
}
