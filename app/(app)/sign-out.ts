"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

export async function signOut() {
  const client = await createServerSupabase();
  if (client) await client.auth.signOut();
  redirect("/sign-in");
}
