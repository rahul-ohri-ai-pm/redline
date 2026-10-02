import type { RenterProfile } from "../analysis/types";
import { toRenterProfile } from "./mapper";
import type { ProfileStore, SavedProfile } from "./types";
import { validateProfileInput, type FieldKey, type RawProfileInput } from "./validate";

export type SaveResult =
  | { ok: true; saved: SavedProfile; profile: RenterProfile }
  | { ok: false; errors: Partial<Record<FieldKey | "form", string>> };

/**
 * Validates the questionnaire, saves it for the user, and returns the
 * RenterProfile the analysis engine takes. Nothing is written when
 * validation fails.
 */
export async function submitProfile(
  store: ProfileStore,
  userId: string,
  raw: RawProfileInput,
): Promise<SaveResult> {
  const result = validateProfileInput(raw);
  if (!result.ok) return result;
  try {
    await store.save(userId, result.value);
  } catch {
    return { ok: false, errors: { form: "Your answers didn't save. Try again in a minute." } };
  }
  return { ok: true, saved: result.value, profile: toRenterProfile(result.value) };
}
