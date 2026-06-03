"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { AuthContext, registerUnauthorizedHandler } from "@/src/lib/auth/hooks";
import { sanitizePostAuthRedirect } from "@/src/lib/auth/safe-redirect";
import { createSupabaseBrowserClient, getURL } from "@/src/lib/supabase/browser";
import type { AuthContextValue } from "@/src/lib/auth/types";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
  const [session, setSession] = React.useState<AuthContextValue["session"]>(null);
  const [user, setUser] = React.useState<AuthContextValue["user"]>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;

    void supabase.auth.getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setSession(data.session);
        setUser(data.session?.user ?? null);
        setIsLoading(false);
      })
      .catch(() => {
        // If getSession() rejects (network failure, Supabase outage), release
        // the loading gate so the login page renders instead of spinning forever.
        if (mounted) setIsLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const clearSession = React.useCallback(() => {
    setSession(null);
    setUser(null);
  }, []);

  const signInWithGoogle = React.useCallback(
    async (nextPath = "/app") => {
      const safeNext = sanitizePostAuthRedirect(nextPath);
      const callbackUrl = new URL(getURL("/auth/callback"));
      callbackUrl.searchParams.set("next", safeNext);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl.toString(),
        },
      });

      if (error) {
        throw error;
      }
    },
    [supabase],
  );

  const signOut = React.useCallback(async () => {
    await supabase.auth.signOut();
    clearSession();
    router.push("/login");
    router.refresh();
  }, [clearSession, router, supabase]);

  React.useEffect(() => {
    registerUnauthorizedHandler(() => {
      void supabase.auth.signOut();
      clearSession();
      router.push("/login");
      router.refresh();
    });

    return () => registerUnauthorizedHandler(null);
  }, [clearSession, router, supabase]);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      isLoading,
      signInWithGoogle,
      signOut,
      clearSession,
    }),
    [clearSession, isLoading, session, signInWithGoogle, signOut, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
