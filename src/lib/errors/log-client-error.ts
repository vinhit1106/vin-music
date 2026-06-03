/**
 * Client-side error logging hook for error boundaries.
 * Extend here (e.g. Sentry) without changing boundary UI.
 */
export function logClientError(
  error: Error,
  context?: { digest?: string; boundary?: "route" | "global" },
): void {
  if (process.env.NODE_ENV !== "production") {
    console.error(
      `[Vin Music${context?.boundary ? `:${context.boundary}` : ""}]`,
      error,
      context?.digest ? { digest: context.digest } : undefined,
    );
  }
}
