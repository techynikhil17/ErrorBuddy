import type { ErrorCategory, HttpStatusCategory } from "./classify";
import type { NormalizedError } from "./normalize";

export interface SignatureExtract {
  systemCode?: string;
  statusCode?: number;
  statusCategory?: HttpStatusCategory;
  moduleName?: string;
  variableName?: string;
  propertyName?: string;
  jsonToken?: string;
  jsonPosition?: number;
  port?: number;
  promiseType?: string;
}

export interface ErrorSignature {
  id: string;
  category: ErrorCategory;
  confidence: number;
  match: (error: NormalizedError) => boolean;
  extract: (error: NormalizedError) => SignatureExtract;
}

export const ERROR_SIGNATURES: ErrorSignature[] = [
  {
    id: "commander-config",
    category: "COMMAND_CONFIG_ERROR",
    confidence: 0.99,
    match: (error) => /passthroughoptions|enablepositionaloptions/i.test(buildHaystack(error)),
    extract: () => ({ systemCode: "COMMANDER" }),
  },
  {
    id: "address-in-use",
    category: "ADDRESS_IN_USE",
    confidence: 0.98,
    match: (error) => /\beaddrinuse\b|address already in use/i.test(buildHaystack(error)),
    extract: (error) => ({
      systemCode: "EADDRINUSE",
      port: extractPort(error.message),
    }),
  },
  {
    id: "connection-refused",
    category: "CONNECTION_REFUSED",
    confidence: 0.97,
    match: (error) => /\beconnrefused\b|connection refused/i.test(buildHaystack(error)),
    extract: (error) => ({
      systemCode: "ECONNREFUSED",
      port: extractPort(error.message),
    }),
  },
  {
    id: "permission-denied",
    category: "PERMISSION_DENIED",
    confidence: 0.96,
    match: (error) => /\beacces\b|permission denied/i.test(buildHaystack(error)),
    extract: () => ({ systemCode: "EACCES" }),
  },
  {
    id: "file-not-found",
    category: "FILE_NOT_FOUND",
    confidence: 0.95,
    match: (error) => /\benoent\b|no such file or directory/i.test(buildHaystack(error)),
    extract: (error) => ({
      systemCode: "ENOENT",
      moduleName: error.context.moduleName,
    }),
  },
  {
    id: "module-not-found",
    category: "MODULE_NOT_FOUND",
    confidence: 0.95,
    match: (error) => /cannot find module|module_not_found/i.test(buildHaystack(error)),
    extract: (error) => ({
      moduleName: error.context.moduleName,
    }),
  },
  {
    id: "undefined-access",
    category: "UNDEFINED_ERROR",
    confidence: 0.94,
    match: (error) => /undefined|is not defined|cannot read (properties|property) of undefined/i.test(buildHaystack(error)),
    extract: (error) => ({
      variableName: error.context.variableName,
      propertyName: error.context.accessedProperty,
    }),
  },
  {
    id: "json-parse",
    category: "JSON_PARSE_ERROR",
    confidence: 0.93,
    match: (error) =>
      /unexpected token .*json|unexpected end of json input|json\.parse|json at position/i.test(buildHaystack(error)),
    extract: (error) => ({
      systemCode: "JSON_PARSE",
      jsonToken: error.context.jsonToken,
      jsonPosition: error.context.jsonPosition,
    }),
  },
  {
    id: "promise-rejection",
    category: "PROMISE_ERROR",
    confidence: 0.92,
    match: (error) =>
      /unhandledpromiserejection|unhandled rejection|promise rejected|rejected promise|a promise was rejected/i.test(
        buildHaystack(error),
      ),
    extract: (error) => ({
      promiseType: /unhandledpromiserejection|unhandled rejection/i.test(buildHaystack(error))
        ? "unhandled-rejection"
        : "rejected-promise",
    }),
  },
  {
    id: "network-request",
    category: "NETWORK_ERROR",
    confidence: 0.91,
    match: (error) => /failed to fetch|networkerror/i.test(error.message),
    extract: () => ({ systemCode: "NETWORK_REQUEST" }),
  },
  {
    id: "http-response",
    category: "HTTP_ERROR",
    confidence: 0.9,
    match: (error) => isHttpError(`${error.type} ${error.message}`),
    extract: (error) => {
      const statusCode = extractStatusCode(error.message) ?? error.context.statusCode;
      return {
        statusCode: statusCode ?? undefined,
        statusCategory: classifyHttpStatus(statusCode ?? null),
      };
    },
  },
  {
    id: "network-connectivity",
    category: "NETWORK_ERROR",
    confidence: 0.88,
    match: (error) => /\benotfound\b|\beai_again\b|socket hang up|timed out|network/i.test(buildHaystack(error)),
    extract: () => ({ systemCode: "NETWORK_CONNECTIVITY" }),
  },
  {
    id: "syntax-error",
    category: "SYNTAX_ERROR",
    confidence: 0.86,
    match: (error) => /syntaxerror|unexpected token/i.test(`${error.type} ${error.message}`),
    extract: () => ({ systemCode: "SYNTAX" }),
  },
];

function buildHaystack(error: NormalizedError): string {
  return `${error.type} ${error.message}`.toLowerCase();
}

function extractStatusCode(message: string): number | null {
  const match = message.match(/status code (\d{3})/i);
  return match ? parseInt(match[1], 10) : null;
}

function classifyHttpStatus(status: number | null): HttpStatusCategory {
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

function isHttpError(message: string): boolean {
  return (
    message.includes("Request failed with status code") ||
    message.includes("Network response was not ok") ||
    (message.includes("AxiosError") && message.includes("status"))
  );
}

function extractPort(message: string): number | undefined {
  const match = message.match(/:(\d{2,5})\b/);

  if (!match) {
    return undefined;
  }

  const port = Number(match[1]);
  return Number.isNaN(port) ? undefined : port;
}
