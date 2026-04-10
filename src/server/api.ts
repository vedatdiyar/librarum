import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";

type ErrorShape = {
  error: {
    message: string;
    details?: unknown;
  };
};

type RouteHandler<Args extends unknown[]> = (...args: Args) => Promise<Response>;

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiMessage(message: string, status = 200) {
  return NextResponse.json({ message }, { status });
}

export function withApiHandler<Args extends unknown[]>(
  handler: RouteHandler<Args>
): RouteHandler<Args> {
  return (async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (error) {
      return toApiErrorResponse(error);
    }
  }) as RouteHandler<Args>;
}

export async function parseJsonBody<T>(request: Request, schema: ZodType<T>) {
  let json: unknown;

  try {
    json = await request.json();
  } catch {
    throw new ApiError(400, "Request body must be valid JSON.");
  }

  const parsed = schema.safeParse(json);

  if (!parsed.success) {
    throw new ApiError(400, "Request body is invalid.", parsed.error.flatten());
  }

  return parsed.data;
}

export function parseSearchParams<T>(request: Request, schema: ZodType<T>) {
  const url = new URL(request.url);
  const rawParams = Object.fromEntries(url.searchParams.entries());
  const parsed = schema.safeParse(rawParams);

  if (!parsed.success) {
    throw new ApiError(400, "Query parameters are invalid.", parsed.error.flatten());
  }

  return parsed.data;
}

export function assertFound<T>(
  value: T | null | undefined,
  message = "Resource not found."
): T {
  if (value == null) {
    throw new ApiError(404, message);
  }

  return value;
}

export function normalizeDatabaseError(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    if (error.code === "23505") {
      return new ApiError(409, "Resource already exists.");
    }

    if (error.code === "23503") {
      return new ApiError(409, "Referenced resource does not exist.");
    }

    if (error.code === "23514") {
      return new ApiError(400, "Database constraint violation.");
    }
  }

  return error;
}

function toApiErrorResponse(error: unknown) {
  const normalizedError = normalizeDatabaseError(error);

  if (normalizedError instanceof ApiError) {
    return NextResponse.json<ErrorShape>(
      {
        error: {
          message: normalizedError.message,
          details: normalizedError.details
        }
      },
      { status: normalizedError.status }
    );
  }

  if (normalizedError instanceof ZodError) {
    return NextResponse.json<ErrorShape>(
      {
        error: {
          message: "Validation failed.",
          details: normalizedError.flatten()
        }
      },
      { status: 400 }
    );
  }

  console.error(normalizedError);

  return NextResponse.json<ErrorShape>(
    {
      error: {
        message: "Internal server error."
      }
    },
    { status: 500 }
  );
}
