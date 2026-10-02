import type { DocumentPatch, DocumentRow, NewDocument, SavedDocument } from "./types";

export function rowToDocument(row: DocumentRow): SavedDocument {
  return {
    id: row.id,
    title: row.title,
    extractedText: row.extracted_text,
    sections: row.sections,
    profileSnapshot: row.profile_snapshot,
    report: row.report,
    createdAt: row.created_at,
  };
}

export function documentToInsertRow(userId: string, doc: NewDocument) {
  return {
    user_id: userId,
    title: doc.title,
    extracted_text: doc.extractedText,
    sections: doc.sections,
    profile_snapshot: doc.profileSnapshot,
    report: doc.report,
  };
}

export function patchToRow(patch: DocumentPatch): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.profileSnapshot !== undefined) row.profile_snapshot = patch.profileSnapshot;
  if (patch.report !== undefined) row.report = patch.report;
  return row;
}
