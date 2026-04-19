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
    id: "rust-compile-error",
    category: "RUST_ERROR",
    confidence: 0.96,
    match: (error) =>
      /error\[E\d+\]|^error:/m.test(buildHaystack(error)) && /\.rs:\d+/i.test(buildHaystack(error)),
    extract: (error) => ({
      systemCode: error.message.match(/error\[(E\d+)\]/)?.[1] ?? "RUST_COMPILE",
    }),
  },
  {
    id: "rust-runtime-panic",
    category: "RUST_ERROR",
    confidence: 0.95,
    match: (error) => /thread '.+' panicked at/.test(buildHaystack(error)),
    extract: () => ({ systemCode: "RUST_PANIC" }),
  },
  {
    id: "java-exception",
    category: "JAVA_ERROR",
    confidence: 0.95,
    match: (error) =>
      /exception in thread|at com\.|at java\.|at org\.|\.java:\d+/i.test(buildHaystack(error)) ||
      error.type === "JavaException",
    extract: (error) => ({
      systemCode: error.message.match(/(\w+Exception|\w+Error):/)?.[1] ?? "JAVA_EXCEPTION",
    }),
  },
  {
    id: "java-oom",
    category: "OUT_OF_MEMORY",
    confidence: 0.97,
    match: (error) => /java\.lang\.OutOfMemoryError/i.test(buildHaystack(error)),
    extract: () => ({ systemCode: "JAVA_OOM" }),
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
  {
    id: "convex-function-not-found",
    category: "CONVEX_FUNCTION_NOT_FOUND",
    confidence: 0.97,
    match: (error) =>
      (error.message.includes("Convex:") || error.message.includes("[Convex]")) &&
      error.message.includes("Could not find public function"),
    extract: () => ({ systemCode: "CONVEX_FUNCTION_NOT_FOUND" }),
  },
  {
    id: "rails-routing-error",
    category: "RAILS_ERROR",
    confidence: 0.95,
    match: (error) => /ActionController::|ActionDispatch::Routing/i.test(buildHaystack(error)),
    extract: () => ({ systemCode: "RAILS_ROUTING" }),
  },
  {
    id: "rails-activerecord-error",
    category: "RAILS_ERROR",
    confidence: 0.95,
    match: (error) => /ActiveRecord::/i.test(buildHaystack(error)),
    extract: (error) => ({
      systemCode: error.message.match(/(ActiveRecord::\w+)/)?.[1] ?? "RAILS_AR",
    }),
  },
  {
    id: "nextjs-compile-error",
    category: "NEXTJS_ERROR",
    confidence: 0.94,
    match: (error) =>
      /Failed to compile|Module not found: Error:|Can't resolve/i.test(buildHaystack(error)) &&
      /next/i.test(buildHaystack(error)),
    extract: () => ({ systemCode: "NEXT_COMPILE" }),
  },
  // ─── Prisma ───────────────────────────────────────────────────────────────
  {
    id: "prisma-query-error",
    category: "PRISMA_ERROR",
    confidence: 0.97,
    match: (error) => /PrismaClientKnownRequestError|\bP\d{4}\b/.test(buildHaystack(error)),
    extract: (error) => ({
      systemCode: (error.message.match(/\b(P\d{4})\b/)?.[1]) ?? "PRISMA_QUERY",
    }),
  },
  {
    id: "prisma-init-error",
    category: "PRISMA_ERROR",
    confidence: 0.96,
    match: (error) =>
      /PrismaClientInitializationError|Can't reach database server/i.test(buildHaystack(error)),
    extract: (error) => ({
      systemCode: "PRISMA_INIT",
      port: extractPort(error.message),
    }),
  },
  // ─── Docker ───────────────────────────────────────────────────────────────
  {
    id: "docker-daemon-error",
    category: "DOCKER_ERROR",
    confidence: 0.96,
    match: (error) =>
      /Error response from daemon:|Cannot connect to the Docker daemon/i.test(buildHaystack(error)),
    extract: () => ({ systemCode: "DOCKER_DAEMON" }),
  },
  {
    id: "docker-image-not-found",
    category: "DOCKER_ERROR",
    confidence: 0.95,
    match: (error) => /Unable to find image/.test(error.message) && /locally/i.test(error.message),
    extract: () => ({ systemCode: "DOCKER_IMAGE_NOT_FOUND" }),
  },
  // ─── Python ───────────────────────────────────────────────────────────────
  {
    id: "python-traceback",
    category: "PYTHON_ERROR",
    confidence: 0.95,
    match: (error) =>
      /Traceback \(most recent call last\):|File ".+?\.py", line/i.test(buildHaystack(error)),
    extract: () => ({ systemCode: "PYTHON_TRACEBACK" }),
  },
  {
    id: "python-import-error",
    category: "PYTHON_ERROR",
    confidence: 0.96,
    match: (error) => /ModuleNotFoundError: No module named/i.test(buildHaystack(error)),
    extract: (error) => ({
      systemCode: "PYTHON_IMPORT",
      moduleName: error.message.match(/No module named ['"](.*?)['"]/i)?.[1],
    }),
  },
  // ─── Go ───────────────────────────────────────────────────────────────────
  {
    id: "go-panic",
    category: "GO_PANIC",
    confidence: 0.95,
    match: (error) => /panic:/.test(error.message) && /goroutine \d+/.test(error.message),
    extract: () => ({ systemCode: "GO_PANIC" }),
  },
  {
    id: "go-build-error",
    category: "BUILD_ERROR",
    confidence: 0.94,
    match: (error) => /\.go:\d+:\d+:|build failed/i.test(buildHaystack(error)),
    extract: () => ({ systemCode: "GO_BUILD" }),
  },
  // ─── System resources ─────────────────────────────────────────────────────
  {
    id: "out-of-memory",
    category: "OUT_OF_MEMORY",
    confidence: 0.97,
    match: (error) =>
      /ENOMEM|out of memory|JavaScript heap out of memory/i.test(buildHaystack(error)),
    extract: () => ({ systemCode: "ENOMEM" }),
  },
  {
    id: "disk-full",
    category: "DISK_FULL",
    confidence: 0.98,
    match: (error) => /ENOSPC|no space left on device/i.test(buildHaystack(error)),
    extract: () => ({ systemCode: "ENOSPC" }),
  },
  {
    id: "port-conflict-generic",
    category: "PORT_CONFLICT",
    confidence: 0.97,
    match: (error) => /address already in use|\beaddrinuse\b/i.test(buildHaystack(error)),
    extract: (error) => ({
      systemCode: "EADDRINUSE",
      port: extractPort(error.message),
    }),
  },
  // ─── Database (generic) ───────────────────────────────────────────────────
  {
    id: "db-connection",
    category: "DATABASE_ERROR",
    confidence: 0.96,
    match: (error) =>
      /FATAL: password authentication failed|FATAL: role .+ does not exist|could not connect to server/i.test(
        buildHaystack(error),
      ),
    extract: () => ({ systemCode: "DB_CONNECTION" }),
  },
  // ─── TypeScript / build tools ─────────────────────────────────────────────
  {
    id: "ts-type-error",
    category: "BUILD_ERROR",
    confidence: 0.95,
    match: (error) => /error TS\d+:/i.test(buildHaystack(error)),
    extract: (error) => ({
      systemCode: error.message.match(/error (TS\d+):/i)?.[1] ?? "TS_ERROR",
    }),
  },
  {
    id: "webpack-build-error",
    category: "BUILD_ERROR",
    confidence: 0.93,
    match: (error) =>
      /Module build failed|ModuleNotFoundError/i.test(buildHaystack(error)) &&
      /webpack/i.test(buildHaystack(error)),
    extract: () => ({ systemCode: "WEBPACK_BUILD" }),
  },
];

function buildHaystack(error: NormalizedError): string {
  return `${error.type} ${error.message} ${error.stack ?? ""}`.toLowerCase();
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

export function isHttpError(message: string): boolean {
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

/**
 * Scans a (potentially multi-line) error message and returns the first line
 * that contains a high-signal keyword.  This lets clix surface the most
 * useful sentence from a long, noisy Convex / Django / framework stack trace
 * instead of dumping the whole blob at the user.
 *
 * Keywords checked (case-insensitive):
 *   "Could not find" | "Did you forget" | "not found" | "failed"
 */
export function extractKeyMessage(msg: string): string | null {
  const SIGNAL_PATTERNS = [
    /could not find/i,
    /did you forget/i,
    /not found/i,
    /failed/i,
  ];

  const lines = msg.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && SIGNAL_PATTERNS.some((pattern) => pattern.test(trimmed))) {
      return trimmed;
    }
  }

  return null;
}
