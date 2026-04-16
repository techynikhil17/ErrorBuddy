import { NormalizedError } from "./normalize";
import {
  ERROR_SIGNATURES,
  SignatureExtract,
  classifyHttpStatus,
  extractStatusCode,
  isHttpError,
} from "./signatures";

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
  | "CONVEX_FUNCTION_NOT_FOUND"
  | "PRISMA_ERROR"
  | "DOCKER_ERROR"
  | "PYTHON_ERROR"
  | "GO_PANIC"
  | "OUT_OF_MEMORY"
  | "DISK_FULL"
  | "BUILD_ERROR"
  | "DATABASE_ERROR"
  | "PORT_CONFLICT"
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

// Re-export from signatures so call sites that import from classify continue to work.
export { isHttpError, extractStatusCode, classifyHttpStatus };
