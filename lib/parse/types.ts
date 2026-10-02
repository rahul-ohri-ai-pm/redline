/**
 * Types for the `parseFile` seam (.scratch/upload-auth-library/spec.md).
 *
 * `ParseSuccess` carries exactly what `analyzeDocument(text, sections, ...)`
 * takes. `text` is the single normalized, frozen string: it is what the
 * renter previews and what every later step receives unchanged.
 */

import type { Section } from "../analysis/types";

export interface ParseSuccess {
  ok: true;
  text: string;
  sections: Section[];
}

export type RefusalCode =
  /** The file type is not one Redline reads at all. */
  | "unsupported-type"
  /** A supported type whose parser has not been registered yet. */
  | "not-available-yet"
  /** The file opened but holds no text, or none of it was readable. */
  | "no-readable-text"
  /** The browser could not read the file's bytes. */
  | "read-failed";

export interface Refusal {
  ok: false;
  code: RefusalCode;
  /** Plain-English message shown to the renter as written. */
  reason: string;
}

export type ParseOutcome = ParseSuccess | Refusal;

/** The slice of the browser `File` that parsers use. A real `File` satisfies it. */
export interface ParseInput {
  name: string;
  type?: string;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export type FileKind = "pdf" | "docx" | "text";

export type FileParser = (file: ParseInput) => Promise<ParseOutcome>;
