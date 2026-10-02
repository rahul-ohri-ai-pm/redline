/**
 * The single normalization pass. It runs once, in the browser, right after
 * extraction. Its output is the frozen string: previewed, sent, analyzed,
 * stored and checked by `verifyCitation`. Nothing downstream may alter it.
 *
 * It only cleans whitespace and line-break hyphenation. It never drops or
 * rewrites other characters, so control and replacement characters survive
 * for the readability check to see.
 */
export function normalizeText(raw: string): string {
  return (
    raw
      // byte-order mark
      .replace(/^﻿/, "")
      // line endings
      .replace(/\r\n?/g, "\n")
      // non-breaking and other horizontal spaces, tabs
      .replace(/[   \t]/g, " ")
      // a word split across lines with a hyphen: "termi-\nnation" -> "termination"
      .replace(/(\p{Ll})-[ ]*\n[ ]*(\p{Ll})/gu, "$1$2")
      // runs of spaces
      .replace(/ {2,}/g, " ")
      // trailing / leading spaces on each line
      .replace(/ *\n */g, "\n")
      // three or more newlines collapse to one blank line
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}
