/**
 * Plain-text parser. Owns its own readability check; it shares no heuristic
 * with the PDF or DOCX parsers.
 *
 * The normalized text is split into paragraphs (blank-line separated). Each
 * paragraph is checked on its own. The check errs toward "unreadable": a
 * missed garbled paragraph would let a citation point at misread text
 * (ADR 0001, ADR 0009), while a wrongly skipped paragraph is disclosed.
 *
 * The returned `text` is the readable paragraphs only, joined by a blank
 * line. Unreadable paragraphs have no text anywhere in the result, so no
 * citation can ever verify against them.
 */

import { normalizeText } from "./normalize";
import type { ParseOutcome } from "./types";
import type { Section } from "../analysis/types";

const CONTROL_OR_REPLACEMENT = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F�]/;
const RULE_LINE = /^[-=_*~. \n]{3,}$/;

const NUMERIC_TOKEN = /^[\d$€£%#.,:;/()\-–—+]+$/;
const ALNUM_NEUTRAL = /^(\d+[A-Za-z]{1,2}|[A-Za-z]{1,2}\d+|\d+(st|nd|rd|th))$/i;
const WORD_TOKEN = /^\p{L}+(?:['’-]\p{L}+)*$/u;
const VOWEL = /[aeiouyàáâäèéêëìíîïòóôöùúûü]/i;

function trimPunctuation(token: string): string {
  return token.replace(/^[^\p{L}\p{N}$]+|[^\p{L}\p{N}%]+$/gu, "");
}

type Verdict = { readable: true } | { readable: false; reason: string };

function checkParagraph(paragraph: string): Verdict {
  if (CONTROL_OR_REPLACEMENT.test(paragraph)) {
    return {
      readable: false,
      reason: "It has characters that did not come through as text.",
    };
  }
  if (RULE_LINE.test(paragraph)) {
    // A divider line. It has no words to misread.
    return { readable: true };
  }

  let wordLike = 0;
  let bad = 0;
  for (const raw of paragraph.split(/\s+/)) {
    if (raw === "") continue;
    const token = trimPunctuation(raw);
    if (token === "") {
      // pure symbols, for example "%%%&&#@"
      bad += 1;
    } else if (NUMERIC_TOKEN.test(token) || ALNUM_NEUTRAL.test(token)) {
      // numbers, money, section numbers: neither evidence for nor against
    } else if (WORD_TOKEN.test(token)) {
      if (token.length <= 4 || VOWEL.test(token)) wordLike += 1;
      else bad += 1;
    } else {
      bad += 1;
    }
  }

  if (wordLike === 0) {
    return {
      readable: false,
      reason: "It has no recognizable words.",
    };
  }
  if (bad / (wordLike + bad) > 0.2) {
    return {
      readable: false,
      reason: "Most of it is scrambled, not recognizable words.",
    };
  }
  return { readable: true };
}

/** Parses already-decoded text. Also used for text the renter pastes. */
export function parsePlainTextString(raw: string): ParseOutcome {
  const normalized = normalizeText(raw);
  if (normalized === "") {
    return {
      ok: false,
      code: "no-readable-text",
      reason: "There is no text here to read.",
    };
  }

  const paragraphs = normalized.split(/\n{2,}/);
  const sections: Section[] = paragraphs.map((paragraph, index) => {
    const id = `paragraph-${index + 1}`;
    const verdict = checkParagraph(paragraph);
    return verdict.readable
      ? { id, text: paragraph, readable: true }
      : { id, text: null, readable: false, reason: verdict.reason };
  });

  const readable = sections.flatMap((s) => (s.readable ? [s.text] : []));
  if (readable.length === 0) {
    return {
      ok: false,
      code: "no-readable-text",
      reason:
        "Nothing in this could be read as text. The file may be damaged or may not be a text file.",
    };
  }

  return { ok: true, text: readable.join("\n\n"), sections };
}

function decode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  if (bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder("utf-16le").decode(bytes.subarray(2));
  }
  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    return new TextDecoder("utf-16be").decode(bytes.subarray(2));
  }
  // Invalid UTF-8 becomes U+FFFD, which the readability check then catches.
  return new TextDecoder("utf-8").decode(bytes);
}

export async function parsePlainText(file: {
  arrayBuffer(): Promise<ArrayBuffer>;
}): Promise<ParseOutcome> {
  let raw: string;
  try {
    raw = decode(await file.arrayBuffer());
  } catch {
    return {
      ok: false,
      code: "read-failed",
      reason: "Your browser couldn't open this file. Try picking it again.",
    };
  }
  return parsePlainTextString(raw);
}
