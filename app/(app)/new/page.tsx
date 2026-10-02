import type { Metadata } from "next";
import { createSupabaseProfileStore } from "@/lib/profile/supabase-store";
import { createServerSupabase, getServerUser } from "@/lib/supabase/server";
import { UploadPreview } from "./UploadPreview";
import type { ProfileStatus } from "./AnalyzePanel";

export const metadata: Metadata = {
  title: "Add a document - Redline",
};

// Reads the session, so it can't be prerendered.
export const dynamic = "force-dynamic";

async function loadProfileStatus(): Promise<ProfileStatus> {
  // Parsing and preview work signed out and without Supabase configured.
  const user = await getServerUser();
  if (!user) return { kind: "signed-out" };
  const client = await createServerSupabase();
  if (!client) return { kind: "signed-out" };
  try {
    const saved = await createSupabaseProfileStore(client).load(user.id);
    if (!saved) return { kind: "none" };
    return {
      kind: "saved",
      profile: { ...saved.answers, redLineCount: saved.redLines.length },
    };
  } catch {
    return { kind: "failed" };
  }
}

export default async function NewDocumentPage() {
  return <UploadPreview profileStatus={await loadProfileStatus()} />;
}
