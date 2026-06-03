import type { PostgrestError } from "@supabase/supabase-js";
import { ApiError } from "../../../src/lib/api/errors";

export function throwSupabase(error: PostgrestError | null): void {
  if (!error) return;

  // Common Postgres codes:
  // 23505 unique_violation
  // 23503 foreign_key_violation
  if (error.code === "23505") {
    throw new ApiError({
      code: "CONFLICT",
      message: "Resource already exists.",
      status: 409,
      details: error,
    });
  }

  if (error.code === "23503") {
    throw new ApiError({
      code: "BAD_REQUEST",
      message: "Invalid reference.",
      status: 400,
      details: error,
    });
  }

  throw new ApiError({
    code: "INTERNAL_ERROR",
    message: "Database error.",
    status: 500,
    details: error,
  });
}

