import { enrichErrorContext, ErrorContext } from "./contextEnricher";
import { parseStackTrace, StackLocation } from "./stackParser";

export interface NormalizedError {
  message: string;
  stack?: string;
  type: string;
  location?: StackLocation;
  context: ErrorContext;
}

export function normalizeError(error: unknown): NormalizedError {
  if (error instanceof Error) {
    const location = parseStackTrace(error.stack);
    return {
      message: error.message || "An unknown error occurred.",
      stack: error.stack,
      type: error.name || "Error",
      location,
      context: enrichErrorContext(error.message, location),
    };
  }

  if (typeof error === "string") {
    const location = parseStackTrace(error);
    return {
      message: error,
      stack: error,
      type: "StringError",
      location,
      context: enrichErrorContext(error, location),
    };
  }

  if (typeof error === "object" && error !== null) {
    const candidate = error as { message?: unknown; stack?: unknown; name?: unknown };
    const message =
      typeof candidate.message === "string"
        ? candidate.message
        : "A non-standard error object was thrown.";
    const stack = typeof candidate.stack === "string" ? candidate.stack : undefined;
    const location = parseStackTrace(stack);

    return {
      message,
      stack,
      type: typeof candidate.name === "string" ? candidate.name : "UnknownObjectError",
      location,
      context: enrichErrorContext(message, location),
    };
  }

  return {
    message: `A non-error value was thrown: ${String(error)}`,
    type: typeof error,
    context: {},
  };
}
