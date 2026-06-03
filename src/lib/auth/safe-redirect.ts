/**
 * Post-auth redirect hardening for OAuth callback and login flows.
 *
 * `new URL(userControlled, origin)` treats protocol-relative paths like `//evil.com`
 * as off-site redirects. We only allow same-origin relative app paths.
 */

export const DEFAULT_POST_AUTH_PATH = "/app";

/**
 * Returns a safe in-app path for redirects after sign-in.
 * Falls back to `/app` when the value is missing or unsafe.
 */
export function sanitizePostAuthRedirect(
  next: string | null | undefined,
): string {
  if (next == null || typeof next !== "string") {
    return DEFAULT_POST_AUTH_PATH;
  }

  const trimmed = next.trim();
  if (!trimmed) {
    return DEFAULT_POST_AUTH_PATH;
  }

  // Must be a root-relative path (single leading slash) starting with /app.
  if (!trimmed.startsWith("/app") || trimmed.startsWith("//")) {
    return DEFAULT_POST_AUTH_PATH;
  }

  // Must strictly be '/app' or a path under '/app/'.
  if (trimmed !== "/app" && !trimmed.startsWith("/app/")) {
    return DEFAULT_POST_AUTH_PATH;
  }

  if (trimmed.includes("\\")) {
    return DEFAULT_POST_AUTH_PATH;
  }

  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("http:") ||
    lower.startsWith("https:") ||
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.includes("javascript:") ||
    lower.includes("data:")
  ) {
    return DEFAULT_POST_AUTH_PATH;
  }

  try {
    const parsed = new URL(trimmed, "https://localhost");
    const path = `${parsed.pathname}${parsed.search}${parsed.hash}`;

    if (!path.startsWith("/") || path.startsWith("//")) {
      return DEFAULT_POST_AUTH_PATH;
    }

    return path;
  } catch {
    return DEFAULT_POST_AUTH_PATH;
  }
}
