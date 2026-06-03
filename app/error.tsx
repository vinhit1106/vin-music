"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, Home, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { logClientError } from "@/src/lib/errors/log-client-error";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logClientError(error, { digest: error.digest, boundary: "route" });
  }, [error]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md border-border/80 bg-card/85">
        <CardHeader>
          <div className="mb-2 inline-flex size-10 items-center justify-center rounded-md border border-border/70 bg-muted/50">
            <AlertCircle className="size-5 text-destructive" />
          </div>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>
            This page hit an unexpected error. You can try again or return to
            the app home.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => reset()} className="gap-2">
            <RotateCcw className="size-4" />
            Try again
          </Button>
          <Button variant="outline" render={<Link href="/app" />} className="gap-2">
            <Home className="size-4" />
            Return home
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
