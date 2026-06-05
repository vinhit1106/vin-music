"use client";

import { useEffect } from "react";
import { AlertCircle, Home, RotateCcw } from "lucide-react";

import { logClientError } from "@/src/lib/errors/log-client-error";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logClientError(error, { digest: error.digest, boundary: "global" });
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-background px-4 font-sans text-foreground antialiased">
        <div className="w-full max-w-md rounded-lg border border-border/80 bg-card/85 p-6 shadow-sm">
          <div className="mb-3 inline-flex size-10 items-center justify-center rounded-md border border-border/70 bg-muted/50">
            <AlertCircle className="size-5 text-destructive" />
          </div>
          <h1 className="text-lg font-bold tracking-tight">
            Something went wrong
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            VinVibe ran into an unexpected error. Try again or go back to the
            app home.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
            >
              <RotateCcw className="size-4" />
              Try again
            </button>
            <a
              href="/app"
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-muted"
            >
              <Home className="size-4" />
              Return home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
