import { handleAskRequest } from "@/lib/ask/handler";
import { createSupabaseDocumentStore } from "@/lib/documents/supabase-store";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request): Promise<Response> {
  const client = await createServerSupabase();
  if (!client) {
    return new Response(
      JSON.stringify({ error: "Sign in to ask a question.", code: "signed-out" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }
  return handleAskRequest(request, {
    getUser: async () => {
      const { data } = await client.auth.getUser();
      return data.user ? { id: data.user.id } : null;
    },
    store: createSupabaseDocumentStore(client),
  });
}
