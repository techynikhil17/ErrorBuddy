import { NormalizedError } from "./normalize";
import { ERROR_SIGNATURES, SignatureExtract } from "./signatures";

export type ErrorCategory =
  | "NETWORK_ERROR"
  | "CONNECTION_REFUSED"
  | "UNDEFINED_ERROR"
  | "SYNTAX_ERROR"
  | "JSON_PARSE_ERROR"
  | "MODULE_NOT_FOUND"
  | "FILE_NOT_FOUND"
  | "PERMISSION_DENIED"
  | "ADDRESS_IN_USE"
  | "HTTP_ERROR"
  | "COMMAND_CONFIG_ERROR"
  | "PROMISE_ERROR"
  | "UNKNOWN";

export interface ClassifiedError {
  category: ErrorCategory;
  signatureId: string;
  confidence: number;
  details: SignatureExtract;
}

export function classifyError(error: NormalizedError): ClassifiedError {
  const bestMatch = ERROR_SIGNATURES
    .filter((signature) => signature.match(error))
    .sort((left, right) => right.confidence - left.confidence)[0];

  if (!bestMatch) {
    return {
      category: "UNKNOWN",
      signatureId: "fallback",
      confidence: 0.1,
      details: {},
    };
  }

  return {
    category: bestMatch.category,
    signatureId: bestMatch.id,
    confidence: bestMatch.confidence,
    details: bestMatch.extract(error),
  };
}

export type HttpStatusCategory =
  | "SERVER_ERROR"
  | "CLIENT_ERROR"
  | "REDIRECTION"
  | "UNKNOWN";

export function isHttpError(message: string): boolean {
  return (
    message.includes("Request failed with status code") ||
    message.includes("Network response was not ok") ||
    (message.includes("AxiosError") && message.includes("status"))
  );
}

export function extractStatusCode(message: string): number | null {
  const match = message.match(/status code (\d{3})/i);
  return match ? parseInt(match[1], 10) : null;
}

export function classifyHttpStatus(status: number | null): HttpStatusCategory {
  if (!status) {
    return "UNKNOWN";
  }

  if (status >= 500) {
    return "SERVER_ERROR";
  }

  if (status >= 400) {
    return "CLIENT_ERROR";
  }

  if (status >= 300) {
    return "REDIRECTION";
  }

  return "UNKNOWN";
}
