/** The four classes the gate sorts a document into. Only the first passes. */
export const DOCUMENT_TYPES = [
  "residential-lease",
  "freelance-agreement",
  "terms-of-service",
  "other",
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export function isDocumentType(value: unknown): value is DocumentType {
  return (
    typeof value === "string" &&
    (DOCUMENT_TYPES as readonly string[]).includes(value)
  );
}

/**
 * What the gate decided. There is no "pass by default": a failed or
 * malformed classification is `error`, which the caller must show with a
 * retry, never treat as a pass.
 */
export type GateOutcome =
  | { status: "pass"; documentType: "residential-lease" }
  | { status: "refused"; documentType: Exclude<DocumentType, "residential-lease"> }
  | { status: "error"; message: string };
