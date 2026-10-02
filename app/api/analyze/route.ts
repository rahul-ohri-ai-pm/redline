import { handleAnalyzeRequest } from "@/lib/documents/analyze-handler";
import { createSupabaseDocumentStore } from "@/lib/documents/supabase-store";
import { createSupabaseProfileStore } from "@/lib/profile/supabase-store";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
// Analysis makes several model calls in a row.
export const maxDuration = 120;

export async function POST(request: Request): Promise<Response> {
  const client = await createServerSupabase();
  if (!client) {
    return new Response(
      JSON.stringify({ error: "Sign in to analyze a document.", code: "signed-out" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }
  return handleAnalyzeRequest(request, {
    getUser: async () => {
      const { data } = await client.auth.getUser();
      return data.user ? { id: data.user.id } : null;
    },
    documents: createSupabaseDocumentStore(client),
    profiles: createSupabaseProfileStore(client),
  });
}
