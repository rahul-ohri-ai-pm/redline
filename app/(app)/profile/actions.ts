"use server";

import { requireUser, createServerSupabase } from "@/lib/supabase/server";
import { createSupabaseProfileStore } from "@/lib/profile/supabase-store";
import { submitProfile } from "@/lib/profile/service";
import type { FieldKey } from "@/lib/profile/validate";

export type ProfileFormState =
  | { status: "idle" }
  | { status: "saved" }
  | { status: "error"; errors: Partial<Record<FieldKey | "form", string>> };

function parseRedLines(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((p) => ({
      id: typeof p?.id === "string" ? p.id : null,
      text: typeof p?.text === "string" ? p.text : "",
    }));
  } catch {
    return [];
  }
}

const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v : "");

export async function saveProfile(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const user = await requireUser("/profile");
  const client = await createServerSupabase();
  if (!client) {
    return { status: "error", errors: { form: "Accounts aren't set up on this deployment." } };
  }
  const result = await submitProfile(createSupabaseProfileStore(client), user.id, {
    state: str(formData.get("state")),
    pets: str(formData.get("pets")),
    jointLease: str(formData.get("jointLease")),
    renterType: str(formData.get("renterType")),
    redLines: parseRedLines(formData.get("redLines")),
  });
  return result.ok ? { status: "saved" } : { status: "error", errors: result.errors };
}
