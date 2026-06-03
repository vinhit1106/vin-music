import { ZodError } from "zod";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "UPSTREAM_ERROR"
  | "INTERNAL_ERROR";

export type ApiErrorShape = {
  code: ApiErrorCode;
  message: string;
  details?: unknown;
};

export class ApiError extends Error {
  public readonly code: ApiErrorCode;
  public readonly details?: unknown;
  public readonly status: number;

  constructor(args: {
    code: ApiErrorCode;
    message: string;
    status: number;
    details?: unknown;
  }) {
    super(args.message);
    this.name = "ApiError";
    this.code = args.code;
    this.status = args.status;
    this.details = args.details;
  }
}

export function zodErrorToDetails(error: ZodError): unknown {
  return error.flatten();
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (error instanceof ZodError) {
    return new ApiError({
      code: "BAD_REQUEST",
      message: "Invalid request.",
      status: 400,
      details: zodErrorToDetails(error),
    });
  }

  if (error instanceof Error) {
    return new ApiError({
      code: "INTERNAL_ERROR",
      message: error.message || "Unexpected error.",
      status: 500,
    });
  }

  return new ApiError({
    code: "INTERNAL_ERROR",
    message: "Unexpected error.",
    status: 500,
    details: error,
  });
}

