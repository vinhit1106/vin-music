import { NextResponse } from "next/server";

import { sanitizePostAuthRedirect } from "@/src/lib/auth/safe-redirect";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  // Never pass raw `next` into `new URL()` — protocol-relative paths redirect off-site.
  const safeNextPath = sanitizePostAuthRedirect(
    requestUrl.searchParams.get("next"),
  );

  if (!code) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.redirect(new URL(safeNextPath, request.url));
}
