import type { SupabaseClient } from "@supabase/supabase-js";
import { documentToInsertRow, patchToRow, rowToDocument } from "./mapper";
import type { DocumentRow, DocumentStore } from "./types";

const COLUMNS =
  "id, user_id, title, extracted_text, sections, profile_snapshot, report, created_at";

/**
 * Supabase-backed store. Pass a client that carries the signed-in user's
 * session; row-level security then limits every query to that user's rows.
 */
export function createSupabaseDocumentStore(client: SupabaseClient): DocumentStore {
  return {
    async insert(userId, doc) {
      const { data, error } = await client
        .from("documents")
        .insert(documentToInsertRow(userId, doc))
        .select(COLUMNS)
        .single();
      if (error) throw new Error(`document save failed: ${error.message}`);
      return rowToDocument(data as DocumentRow);
    },

    async get(userId, id) {
      const { data, error } = await client
        .from("documents")
        .select(COLUMNS)
        .eq("id", id)
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw new Error(`document load failed: ${error.message}`);
      return data ? rowToDocument(data as DocumentRow) : null;
    },

    async list(userId) {
      const { data, error } = await client
        .from("documents")
        .select(COLUMNS)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw new Error(`document list failed: ${error.message}`);
      return ((data ?? []) as DocumentRow[]).map(rowToDocument);
    },

    async update(userId, id, patch) {
      const row = patchToRow(patch);
      if (Object.keys(row).length === 0) return false;
      const { data, error } = await client
        .from("documents")
        .update(row)
        .eq("id", id)
        .eq("user_id", userId)
        .select("id");
      if (error) throw new Error(`document update failed: ${error.message}`);
      return (data ?? []).length > 0;
    },

    async remove(userId, id) {
      const { data, error } = await client
        .from("documents")
        .delete()
        .eq("id", id)
        .eq("user_id", userId)
        .select("id");
      if (error) throw new Error(`document delete failed: ${error.message}`);
      return (data ?? []).length > 0;
    },
  };
}
