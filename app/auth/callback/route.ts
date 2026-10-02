import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { resolveCallback } from "@/lib/supabase/auth";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const client = await createServerSupabase();
  const { redirectTo } = await resolveCallback(
    client,
    searchParams.get("code"),
    searchParams.get("next"),
  );
  return NextResponse.redirect(new URL(redirectTo, origin));
}
