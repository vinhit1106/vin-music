import type { Session, User } from "@supabase/supabase-js";

export type AuthContextValue = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signInWithGoogle: (nextPath?: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearSession: () => void;
};
