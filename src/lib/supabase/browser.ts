"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

function getEnv(value: string | undefined, name: string): string {
  if (!value) {
    if (typeof window === "undefined") {
      return name === "NEXT_PUBLIC_SUPABASE_URL"
        ? "https://placeholder-project.supabase.co"
        : "placeholder-anon-key";
    }
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export function createSupabaseBrowserClient(): SupabaseClient {
  if (browserClient) {
    return browserClient;
  }

  browserClient = createBrowserClient(
    getEnv(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL"),
    getEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );

  return browserClient;
}

export function getURL(path = ""): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");

  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}
