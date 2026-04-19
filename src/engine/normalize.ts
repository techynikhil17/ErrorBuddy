import { enrichErrorContext, ErrorContext } from "./contextEnricher";
import { parseStackTrace, StackLocation } from "./stackParser";
import { sanitizeErrorText } from "../utils/sanitize";

export interface NormalizedError {
  message: string;
  stack?: string;
  type: string;
  location?: StackLocation;
  context: ErrorContext;
}

export function normalizeError(error: unknown): NormalizedError {
  if (error instanceof Error) {
    const message = readErrorString(error, "message") ?? "An unknown error occurred.";
    const stack = readErrorString(error, "stack");
    const type = readErrorString(error, "name") ?? "Error";
    const location = parseStackTrace(stack);
    return {
      message,
      stack,
      type,
      location,
      context: enrichErrorContext(message, location),
    };
  }

  if (typeof error === "string") {
    const sanitized = sanitizeErrorText(error);
    const location = parseStackTrace(sanitized);
    return {
      message: sanitized,
      stack: sanitized,
      type: "StringError",
      location,
      context: enrichErrorContext(sanitized, location),
    };
  }

  if (typeof error === "object" && error !== null) {
    const candidate = error as Record<string, unknown>;
    const message = readOwnString(candidate, "message") ?? "A non-standard error object was thrown.";
    const stack = readOwnString(candidate, "stack");
    const location = parseStackTrace(stack);

    return {
      message,
      stack,
      type: readOwnString(candidate, "name") ?? "UnknownObjectError",
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

function readErrorString(target: Error, key: "message" | "stack" | "name"): string | undefined {
  try {
    const value = Reflect.get(target, key);
    return typeof value === "string" ? sanitizeErrorText(value) : undefined;
  } catch {
    return undefined;
  }
}

function readOwnString(target: Record<string, unknown>, key: "message" | "stack" | "name"): string | undefined {
  if (!Object.prototype.hasOwnProperty.call(target, key)) {
    return undefined;
  }

  const descriptor = Object.getOwnPropertyDescriptor(target, key);

  if (!descriptor || typeof descriptor.get === "function") {
    return undefined;
  }

  return typeof descriptor.value === "string" ? sanitizeErrorText(descriptor.value) : undefined;
}
