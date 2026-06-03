import type { ApiErrorShape } from "@/src/lib/api/errors";
import { toApiError } from "@/src/lib/api/errors";

export type ApiSuccessResponse<T> = { success: true; data: T };
export type ApiFailureResponse = { success: false; error: ApiErrorShape };
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiFailureResponse;

export function successResponse<T>(data: T, init?: ResponseInit): Response {
  const body: ApiSuccessResponse<T> = { success: true, data };
  return Response.json(body, { status: 200, ...init });
}

export function errorResponse(error: unknown): Response {
  const apiError = toApiError(error);
  const body: ApiFailureResponse = {
    success: false,
    error: {
      code: apiError.code,
      message: apiError.message,
      details: apiError.details,
    },
  };
  return Response.json(body, { status: apiError.status });
}

