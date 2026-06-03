import { ApiError } from "@/src/lib/api/errors";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export type AuthedUser = {
  id: string;
  email?: string;
};

export async function requireUser(): Promise<AuthedUser> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new ApiError({
      code: "UNAUTHORIZED",
      message: "You must be signed in.",
      status: 401,
      details: error?.message,
    });
  }

  return { id: data.user.id, email: data.user.email ?? undefined };
}

