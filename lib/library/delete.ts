/**
 * Deleting a saved document. The store removes the whole row, so the
 * extracted text, sections, profile snapshot and report go with it. The
 * user id always comes from the session, never from the request.
 */

import type { DocumentStore } from "../documents/types";

export type DeleteDocumentResult =
  | { ok: true }
  | { ok: false; reason: "signed-out" | "not-found" | "failed"; message: string };

export interface DeleteDocumentDeps {
  getUser: () => Promise<{ id: string } | null>;
  store: DocumentStore;
}

export const DELETE_FAILED_MESSAGE = "Couldn't delete this document. It's still in your library. Try again.";
export const DELETE_NOT_FOUND_MESSAGE = "This document is already gone.";
export const DELETE_SIGNED_OUT_MESSAGE = "Sign in to delete a document.";

export async function deleteDocument(
  id: string,
  deps: DeleteDocumentDeps,
): Promise<DeleteDocumentResult> {
  let user: { id: string } | null;
  try {
    user = await deps.getUser();
  } catch {
    user = null;
  }
  if (!user) return { ok: false, reason: "signed-out", message: DELETE_SIGNED_OUT_MESSAGE };
  if (typeof id !== "string" || id === "") {
    return { ok: false, reason: "not-found", message: DELETE_NOT_FOUND_MESSAGE };
  }
  try {
    const removed = await deps.store.remove(user.id, id);
    return removed
      ? { ok: true }
      : { ok: false, reason: "not-found", message: DELETE_NOT_FOUND_MESSAGE };
  } catch {
    return { ok: false, reason: "failed", message: DELETE_FAILED_MESSAGE };
  }
}
