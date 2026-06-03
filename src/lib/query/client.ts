"use client";

import type { ApiResponse } from "@/src/lib/api/response";
import { ApiError } from "@/src/lib/api/errors";
import { notifyUnauthorized } from "@/src/lib/auth/hooks";

export async function apiFetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const json = (await response.json().catch(() => null)) as ApiResponse<T> | null;
  if (!json) {
    throw new ApiError({
      code: "INTERNAL_ERROR",
      message: "Invalid server response.",
      status: 500,
    });
  }

  if (!json.success) {
    if (response.status === 401) {
      notifyUnauthorized();
    }

    throw new ApiError({
      code: json.error.code,
      message: json.error.message,
      status: response.status || 500,
      details: json.error.details,
    });
  }

  return json.data;
}

