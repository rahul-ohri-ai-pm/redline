/**
 * `parseFile(file)`: the one seam for turning a picked file into the
 * engine's inputs. It runs in the browser and never sends the file anywhere.
 *
 * It picks a parser by file type from a registry. Each parser owns its own
 * readability checks. A type with no registered parser is refused with a
 * "not available yet" message.
 */

import { parseDocx } from "./docx";
import { parsePdf } from "./pdf";
import { parsePlainText, parsePlainTextString } from "./plain-text";
import type { FileKind, FileParser, ParseInput, ParseOutcome } from "./types";

export type {
  FileKind,
  FileParser,
  ParseInput,
  ParseOutcome,
  ParseSuccess,
  Refusal,
  RefusalCode,
} from "./types";

const KIND_LABEL: Record<FileKind, string> = {
  pdf: "PDF",
  docx: "DOCX",
  text: "plain text (.txt)",
};

const KIND_SHORT: Record<FileKind, string> = {
  pdf: "PDF",
  docx: "DOCX",
  text: "Plain text",
};

const SUPPORTED_TYPES_SENTENCE = "PDF, DOCX and plain text (.txt)";

export type ParserRegistry = Partial<Record<FileKind, FileParser>>;

const defaultRegistry: ParserRegistry = {
  text: parsePlainText,
  pdf: parsePdf,
  docx: parseDocx,
};

/** Registers the parser for a file type. Used by tests to swap a parser. */
export function registerParser(kind: FileKind, parser: FileParser): void {
  defaultRegistry[kind] = parser;
}

/** Labels of the file types that can be read right now, for UI copy. */
export function availableFileTypeLabels(
  registry: ParserRegistry = defaultRegistry
): string[] {
  return (Object.keys(KIND_LABEL) as FileKind[])
    .filter((kind) => registry[kind] !== undefined)
    .map((kind) => KIND_LABEL[kind]);
}

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function detectFileKind(file: { name: string; type?: string }): FileKind | null {
  const dot = file.name.lastIndexOf(".");
  const ext = dot >= 0 ? file.name.slice(dot + 1).toLowerCase() : "";
  if (ext === "pdf") return "pdf";
  if (ext === "docx") return "docx";
  if (ext === "txt" || ext === "text") return "text";
  if (ext !== "") return null;
  // No extension: fall back to the MIME type the browser reports.
  const mime = (file.type ?? "").toLowerCase();
  if (mime === "application/pdf") return "pdf";
  if (mime === DOCX_MIME) return "docx";
  if (mime === "text/plain") return "text";
  return null;
}

export async function parseFile(
  file: ParseInput,
  registry: ParserRegistry = defaultRegistry
): Promise<ParseOutcome> {
  const kind = detectFileKind(file);
  if (kind === null) {
    const dot = file.name.lastIndexOf(".");
    const described =
      dot >= 0 ? `a .${file.name.slice(dot + 1)} file` : "a file with no type";
    return {
      ok: false,
      code: "unsupported-type",
      reason: `Redline reads ${SUPPORTED_TYPES_SENTENCE} files. "${file.name}" is ${described}.`,
    };
  }
  const parser = registry[kind];
  if (!parser) {
    return {
      ok: false,
      code: "not-available-yet",
      reason: `${KIND_SHORT[kind]} files can't be read yet. Paste the text instead${
        registry.text ? ", or use a .txt file" : ""
      }.`,
    };
  }
  return parser(file);
}

/** Text the renter pastes goes through the same normalization and readability check. */
export function parsePastedText(raw: string): ParseOutcome {
  return parsePlainTextString(raw);
}
