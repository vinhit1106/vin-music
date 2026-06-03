import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/src/lib/supabase/middleware";

const PAGE_PROTECTED_PREFIXES = ["/app/library", "/app/collections"];
const API_PROTECTED_PREFIXES = ["/api/playlists", "/api/favorites", "/api/history"];

function hasProtectedPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname, search } = request.nextUrl;

  if (hasProtectedPrefix(pathname, PAGE_PROTECTED_PREFIXES) && !user) {
    const loginUrl = new URL("/login", request.url);
    const nextPath = `${pathname}${search}`;
    loginUrl.searchParams.set("next", nextPath);
    return NextResponse.redirect(loginUrl);
  }

  if (hasProtectedPrefix(pathname, API_PROTECTED_PREFIXES) && !user) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "You must be signed in.",
        },
      },
      { status: 401 },
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/app/library/:path*",
    "/app/collections/:path*",
    "/api/playlists/:path*",
    "/api/favorites/:path*",
    "/api/history/:path*",
  ],
};
