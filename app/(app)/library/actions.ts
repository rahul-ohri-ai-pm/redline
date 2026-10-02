"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseDocumentStore } from "@/lib/documents/supabase-store";
import { deleteDocument, DELETE_FAILED_MESSAGE, type DeleteDocumentResult } from "@/lib/library/delete";
import { createServerSupabase, requireUser } from "@/lib/supabase/server";

export async function deleteDocumentAction(id: string): Promise<DeleteDocumentResult> {
  const user = await requireUser("/library");
  const client = await createServerSupabase();
  if (!client) return { ok: false, reason: "failed", message: DELETE_FAILED_MESSAGE };
  const result = await deleteDocument(id, {
    getUser: async () => user,
    store: createSupabaseDocumentStore(client),
  });
  // A document that's already gone still leaves the list stale, so refresh either way.
  if (result.ok || result.reason === "not-found") revalidatePath("/library");
  return result;
}
