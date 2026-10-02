import type { SupabaseClient } from "@supabase/supabase-js";
import { answersToRow, redLinesToRows, rowsToSavedProfile } from "./mapper";
import type { ProfileRow, ProfileStore, RedLineRow } from "./types";

/**
 * Supabase-backed store. Pass a client that carries the signed-in user's
 * session; row-level security then limits every query to that user's rows.
 */
export function createSupabaseProfileStore(client: SupabaseClient): ProfileStore {
  return {
    async load(userId) {
      const { data: profile, error } = await client
        .from("profiles")
        .select("user_id, state, pets, joint_lease, renter_type")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw new Error(`profile load failed: ${error.message}`);
      if (!profile) return null;
      const { data: lines, error: linesError } = await client
        .from("red_lines")
        .select("id, user_id, text, position")
        .eq("user_id", userId)
        .order("position", { ascending: true });
      if (linesError) throw new Error(`red lines load failed: ${linesError.message}`);
      return rowsToSavedProfile(profile as ProfileRow, (lines ?? []) as RedLineRow[]);
    },

    async save(userId, saved) {
      const { error } = await client
        .from("profiles")
        .upsert({ ...answersToRow(userId, saved.answers), updated_at: new Date().toISOString() });
      if (error) throw new Error(`profile save failed: ${error.message}`);

      // Upsert the current list first, then delete what was removed, so a
      // failure part-way never loses lines the user still has.
      const rows = redLinesToRows(userId, saved.redLines);
      if (rows.length > 0) {
        const { error: upsertError } = await client.from("red_lines").upsert(rows);
        if (upsertError) throw new Error(`red lines save failed: ${upsertError.message}`);
      }
      const keep = rows.map((r) => r.id);
      let del = client.from("red_lines").delete().eq("user_id", userId);
      if (keep.length > 0) del = del.not("id", "in", `(${keep.join(",")})`);
      const { error: deleteError } = await del;
      if (deleteError) throw new Error(`red lines cleanup failed: ${deleteError.message}`);
    },
  };
}
