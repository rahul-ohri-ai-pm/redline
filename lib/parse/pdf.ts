/**
 * PDF parser. Runs in the browser; the file is never uploaded. It reads the
 * text layer page by page with pdf.js and owns its own readability check,
 * which shares nothing with the plain-text parser.
 *
 * Each page becomes one section with id `page-N`. A page is readable only if
 * its extracted text passes the checks below. The checks err toward
 * "unreadable": a missed garbled page would let a citation point at misread
 * text (ADR 0001, ADR 0009), while a wrongly skipped page is disclosed.
 *
 * A PDF where no page has any text is a scan. It is refused. Nothing is
 * guessed and nothing is OCR'd.
 */

import { normalizeText } from "./normalize";
import type { ParseOutcome } from "./types";
import type { Section } from "../analysis/types";

type PdfTextItem = { str: string; transform: number[]; height: number };

type PdfjsModule = typeof import("pdfjs-dist/legacy/build/pdf.mjs");

let pdfjsPromise: Promise<PdfjsModule> | null = null;

/** Loaded on first use so nothing PDF-related runs during server rendering. */
function loadPdfjs(): Promise<PdfjsModule> {
  pdfjsPromise ??= import("pdfjs-dist/legacy/build/pdf.mjs").then((pdfjs) => {
    if (typeof window !== "undefined" && !pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
        import.meta.url
      ).toString();
    }
    return pdfjs;
  });
  return pdfjsPromise;
}

/** Rebuilds a page's lines from positioned text items; a wide vertical gap starts a new paragraph. */
function pageText(items: PdfTextItem[]): string {
  let out = "";
  let lastY: number | null = null;
  let lastHeight = 0;
  for (const item of items) {
    if (item.str === "") continue;
    const y = item.transform[5];
    const height = item.height || lastHeight || 12;
    if (lastY !== null) {
      const drop = Math.abs(lastY - y);
      if (drop > height * 0.5) {
        out += drop > Math.max(height, lastHeight) * 1.8 ? "\n\n" : "\n";
      }
    }
    out += item.str;
    lastY = y;
    lastHeight = height;
  }
  return out;
}

const COMMON_WORDS = new Set([
  "the", "and", "of", "to", "a", "in", "is", "be", "or", "for", "on", "by",
  "shall", "tenant", "landlord", "may", "this", "that", "any", "with", "as",
  "at", "an", "all", "not", "if", "will", "must", "per", "no", "are", "from",
]);

/** Characters a real lease page is made of. */
const PLAUSIBLE_CHAR = /[\p{L}\p{N}\s.,;:'"’‘“”()\-–—$%&/#@!?*_+=[\]§¶°•]/u;
const PRIVATE_USE_OR_BAD = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F-�￾￿]/;

type Verdict = { readable: true } | { readable: false; reason: string };

function judgePage(text: string): Verdict {
  if (text === "") {
    return {
      readable: false,
      reason: "It has no text. It may be a picture or a scan.",
    };
  }
  if (PRIVATE_USE_OR_BAD.test(text)) {
    return {
      readable: false,
      reason: "The text on it did not come through as readable characters.",
    };
  }

  const nonSpace = [...text].filter((c) => !/\s/.test(c));
  const plausible = nonSpace.filter((c) => PLAUSIBLE_CHAR.test(c)).length;
  if (plausible / nonSpace.length < 0.93) {
    return {
      readable: false,
      reason: "The text on it is mostly symbols, not words.",
    };
  }

  const words = text.toLowerCase().match(/\p{L}+/gu) ?? [];
  const letters = words.join("");
  // A page with almost no words (a signature line, a page number) has too
  // little to judge by word shape; the character checks above are all it gets.
  if (words.length < 8) {
    return letters.length === 0 && !/\p{N}/u.test(text)
      ? { readable: false, reason: "It has no words on it." }
      : { readable: true };
  }

  const vowels = (letters.match(/[aeiouy]/g) ?? []).length / letters.length;
  const avgLength = letters.length / words.length;
  const common = words.filter((w) => COMMON_WORDS.has(w)).length / words.length;
  if (vowels < 0.25 || vowels > 0.6 || avgLength < 2 || avgLength > 10 || common < 0.04) {
    return {
      readable: false,
      reason: "The text on it is scrambled.",
    };
  }
  return { readable: true };
}

export async function parsePdf(file: {
  arrayBuffer(): Promise<ArrayBuffer>;
}): Promise<ParseOutcome> {
  let task: ReturnType<PdfjsModule["getDocument"]>;
  let doc: Awaited<ReturnType<PdfjsModule["getDocument"]>["promise"]>;
  try {
    const pdfjs = await loadPdfjs();
    // pdf.js takes ownership of the buffer, so hand it a copy.
    const bytes = new Uint8Array(await file.arrayBuffer()).slice();
    task = pdfjs.getDocument({ data: bytes });
    doc = await task.promise;
  } catch (error) {
    const name = (error as { name?: string } | null)?.name;
    return {
      ok: false,
      code: "read-failed",
      reason:
        name === "PasswordException"
          ? "This PDF is password-protected. Remove the password and pick it again."
          : "This file couldn't be opened as a PDF. It may be damaged. Try picking it again.",
    };
  }

  try {
    const pageTexts: string[] = [];
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n);
      const content = await page.getTextContent();
      const items = content.items.filter(
        (item): item is Extract<typeof item, { str: string }> => "str" in item
      );
      pageTexts.push(normalizeText(pageText(items)));
    }

    if (pageTexts.every((t) => t === "")) {
      return {
        ok: false,
        code: "no-readable-text",
        reason:
          "This PDF has no text in it. It looks like a scan or a photo of the pages, which Redline can't read. Use a PDF where you can select the text, or paste the text instead.",
      };
    }

    const sections: Section[] = pageTexts.map((text, index) => {
      const id = `page-${index + 1}`;
      const verdict = judgePage(text);
      return verdict.readable
        ? { id, text, readable: true }
        : { id, text: null, readable: false, reason: verdict.reason };
    });

    const readable = sections.flatMap((s) => (s.readable ? [s.text] : []));
    if (readable.length === 0) {
      return {
        ok: false,
        code: "no-readable-text",
        reason:
          "No page in this PDF came through as readable text. The file may be damaged.",
      };
    }
    return { ok: true, text: readable.join("\n\n"), sections };
  } catch {
    return {
      ok: false,
      code: "read-failed",
      reason: "This file couldn't be read as a PDF. It may be damaged. Try picking it again.",
    };
  } finally {
    await task.destroy();
  }
}
