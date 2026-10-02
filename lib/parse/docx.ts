/**
 * DOCX parser. Runs in the browser; the file is never uploaded. It reads the
 * document body with mammoth and owns its own readability check, which shares
 * nothing with the plain-text or PDF parsers.
 *
 * Each non-empty paragraph (table cells included) becomes one section with id
 * `block-N`, counted over the blocks that are kept. A block is readable only
 * if it passes the checks below. The checks err toward "unreadable": a missed
 * garbled block would let a citation point at misread text (ADR 0001,
 * ADR 0009), while a wrongly skipped block is disclosed to the renter.
 *
 * Not read: footnotes, endnotes, headers, footers and text boxes. A paragraph
 * that holds only a picture is a skipped block, because the picture may be a
 * scan of text. Nothing is OCR'd.
 */

import { normalizeText } from "./normalize";
import type { ParseOutcome } from "./types";
import type { Section } from "../analysis/types";

type MammothModule = typeof import("mammoth");

/** Loaded on first use so nothing DOCX-related runs during server rendering. */
let mammothPromise: Promise<MammothModule> | null = null;
function loadMammoth(): Promise<MammothModule> {
  mammothPromise ??= import("mammoth").then(
    (m) => (m as { default?: MammothModule }).default ?? m
  );
  return mammothPromise;
}

/** Marker used while walking a paragraph; never appears in output text. */
const IMAGE = "\u0001IMAGE\u0001";

type DocNode = {
  type: string;
  value?: string;
  breakType?: string;
  children?: DocNode[];
};

/** The text of one paragraph element, with images marked. */
function paragraphText(node: DocNode): string {
  switch (node.type) {
    case "text":
      return node.value ?? "";
    case "tab":
      return "\t";
    case "break":
      return node.breakType === "line" ? "\n" : "";
    case "image":
      return IMAGE;
    default:
      return (node.children ?? []).map(paragraphText).join("");
  }
}

/** All paragraphs in document order, including those inside tables. */
function collectParagraphs(node: DocNode, out: string[]): void {
  if (node.type === "paragraph") {
    out.push(paragraphText(node));
    return;
  }
  for (const child of node.children ?? []) collectParagraphs(child, out);
}

const COMMON_WORDS = new Set([
  "the", "and", "of", "to", "a", "in", "is", "be", "or", "for", "on", "by",
  "shall", "tenant", "landlord", "may", "this", "that", "any", "with", "as",
  "at", "an", "all", "not", "if", "will", "must", "per", "no", "are", "from",
]);

/** Characters a real clause is made of. */
const PLAUSIBLE_CHAR = /[\p{L}\p{N}\s.,;:'"’‘“”()\-–—$%&/#@!?*_+=[\]§¶°•]/u;
/** Control characters, the replacement character, and private-use code points (symbol-font leftovers). */
const BAD_CHAR = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F-�￾￿]/;

type Verdict = { readable: true } | { readable: false; reason: string };

function judgeBlock(text: string, hadImage: boolean): Verdict {
  if (hadImage && text === "") {
    return {
      readable: false,
      reason: "It's a picture, and Redline can't read any text in it.",
    };
  }
  if (BAD_CHAR.test(text)) {
    return {
      readable: false,
      reason: "Its characters didn't come through as readable text.",
    };
  }
  const nonSpace = [...text].filter((c) => !/\s/.test(c));
  const plausible = nonSpace.filter((c) => PLAUSIBLE_CHAR.test(c)).length;
  if (plausible / nonSpace.length < 0.95) {
    return { readable: false, reason: "It's mostly symbols, not words." };
  }

  const words = text.toLowerCase().match(/\p{L}+/gu) ?? [];
  if (words.length === 0) {
    // A figure on its own, like "$1,200.00" or "12".
    return /\p{N}/u.test(text)
      ? { readable: true }
      : { readable: false, reason: "It has no words." };
  }
  const scrambled = { readable: false as const, reason: "Its letters look scrambled." };

  // A word that is far too long, or long with no vowel in it, is a bad sign.
  for (const word of text.match(/\p{L}+/gu) ?? []) {
    if (word.length > 24) return scrambled;
    if (word.length >= 4 && !/[aeiouyAEIOUY]/.test(word)) return scrambled;
  }

  const letters = words.join("");
  const vowels = (letters.match(/[aeiouy]/g) ?? []).length / letters.length;
  const avgLength = letters.length / words.length;
  if (words.length >= 3 && (vowels < 0.25 || vowels > 0.6 || avgLength > 10)) {
    return scrambled;
  }
  if (words.length >= 6) {
    const common = words.filter((w) => COMMON_WORDS.has(w)).length / words.length;
    if (common < 0.05) return scrambled;
  }
  return { readable: true };
}

/** Rules and blanks ("______", "-----", "....") carry no content and are not blocks. */
function isDecoration(text: string): boolean {
  return /^[\s_\-–—.=*~•·]*$/.test(text);
}

export async function parseDocx(file: {
  arrayBuffer(): Promise<ArrayBuffer>;
}): Promise<ParseOutcome> {
  const paragraphs: string[] = [];
  try {
    const mammoth = await loadMammoth();
    const arrayBuffer = await file.arrayBuffer();
    await mammoth.convertToHtml(
      // mammoth's browser build reads `arrayBuffer`; its Node build reads `buffer`.
      { arrayBuffer, buffer: arrayBuffer } as never,
      {
        // The HTML is thrown away; only the document tree is used, so never
        // read image bytes.
        convertImage: mammoth.images.imgElement(async () => ({ src: "" })),
        transformDocument: (document: DocNode) => {
          collectParagraphs(document, paragraphs);
          return document;
        },
      }
    );
  } catch {
    return {
      ok: false,
      code: "read-failed",
      reason:
        "This file couldn't be opened as a Word document. It may be damaged, password-protected, or an older .doc file. Try picking it again.",
    };
  }

  const sections: Section[] = [];
  let lastReadable: string | null = null;
  for (const raw of paragraphs) {
    const hadImage = raw.includes(IMAGE);
    const text = normalizeText(raw.split(IMAGE).join(""));
    if (text === "" && !hadImage) continue;
    if (text !== "" && isDecoration(text)) continue;
    const id = `block-${sections.length + 1}`;
    const verdict = judgeBlock(text, hadImage);
    if (verdict.readable) {
      sections.push({ id, text, readable: true });
      lastReadable = text;
    } else {
      const after = lastReadable
        ? ` It follows the paragraph that ends “${lastReadable.slice(-40).replace(/\s+/g, " ").trim()}”.`
        : "";
      sections.push({ id, text: null, readable: false, reason: verdict.reason + after });
    }
  }

  const readable = sections.flatMap((s) => (s.readable ? [s.text] : []));
  if (sections.length === 0) {
    return {
      ok: false,
      code: "no-readable-text",
      reason:
        "This Word document has no text in it. Pick a different file, or paste the text instead.",
    };
  }
  if (readable.length === 0) {
    return {
      ok: false,
      code: "no-readable-text",
      reason:
        "No paragraph in this Word document came through as readable text. The file may be damaged.",
    };
  }
  return { ok: true, text: readable.join("\n\n"), sections };
}
