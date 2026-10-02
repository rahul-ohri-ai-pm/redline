import type { RenterProfile, Report, Section } from "../analysis/types";

/** What gets saved. No file, no file name: only extracted text and what came from it. */
export interface NewDocument {
  title: string;
  extractedText: string;
  sections: Section[];
  profileSnapshot: RenterProfile;
  report: Report;
}

export interface SavedDocument extends NewDocument {
  id: string;
  createdAt: string;
}

/** Row shape as stored. */
export interface DocumentRow {
  id: string;
  user_id: string;
  title: string;
  extracted_text: string;
  sections: Section[];
  profile_snapshot: RenterProfile;
  report: Report;
  created_at: string;
}

/** Fields later tickets may change on a saved document. */
export type DocumentPatch = Partial<Pick<NewDocument, "title" | "profileSnapshot" | "report">>;

/**
 * Data access for saved documents. Every method acts for the given user
 * only: another user's document is never returned, changed or removed. The
 * Supabase implementation relies on row-level security as well as filtering
 * on the user id.
 */
export interface DocumentStore {
  insert(userId: string, doc: NewDocument): Promise<SavedDocument>;
  /** Null when the document doesn't exist or isn't this user's. */
  get(userId: string, id: string): Promise<SavedDocument | null>;
  /** Newest first. */
  list(userId: string): Promise<SavedDocument[]>;
  /** Returns false when nothing matched (missing, or not this user's). */
  update(userId: string, id: string, patch: DocumentPatch): Promise<boolean>;
  /** Returns false when nothing matched (missing, or not this user's). */
  remove(userId: string, id: string): Promise<boolean>;
}
