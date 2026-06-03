"use client";

import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/src/lib/auth/provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 45_000,
            retry: (failureCount, error) => {
              const status =
                typeof error === "object" &&
                error !== null &&
                "status" in error &&
                typeof (error as { status?: unknown }).status === "number"
                  ? (error as { status: number }).status
                  : undefined;

              if (status === 401) {
                return false;
              }

              return failureCount < 1;
            },
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true}>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster richColors position="top-right" />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
