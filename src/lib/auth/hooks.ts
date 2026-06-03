"use client";

import * as React from "react";

import type { AuthContextValue } from "@/src/lib/auth/types";

export const AuthContext = React.createContext<AuthContextValue | null>(null);

type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

export function registerUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

export function notifyUnauthorized() {
  unauthorizedHandler?.();
}

export function useAuthContext() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("Auth hooks must be used inside AuthProvider.");
  }
  return context;
}

export function useSession() {
  return useAuthContext().session;
}

export function useUser() {
  return useAuthContext().user;
}

export function useIsAuthenticated() {
  const { user, isLoading } = useAuthContext();
  return !isLoading && Boolean(user);
}
