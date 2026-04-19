import { ClassifiedError, classifyError, classifyHttpStatus, extractStatusCode } from "./classify";
import { extractEntity, detectEntityType } from "./entityExtractor";
import { NormalizedError } from "./normalize";
import { extractKeyMessage } from "./signatures";

export interface ExplainedError {
  title: string;
  what: string;
  why: string;
  category: string;
  confidence: number;
  signatureId: string;
}

export function explainError(
  error: NormalizedError,
  classified: ClassifiedError = classifyError(error),
): ExplainedError {
  const shared = {
    category: classified.category,
    confidence: classified.confidence,
    signatureId: classified.signatureId,
  };

  switch (classified.category) {
    case "NETWORK_ERROR":
      return {
        title: "Network Request Failed",
        what: "The request could not reach the server.",
        why: "A network hop, DNS lookup, browser restriction, or server outage prevented the request from completing.",
        ...shared,
      };
    case "CONNECTION_REFUSED":
      return {
        title: "Connection Refused",
        what: "The target service actively refused the connection attempt.",
        why: classified.details.port
          ? `Nothing is accepting connections on port ${classified.details.port} right now.`
          : "The host is reachable, but the target port is closed or the service is down.",
        ...shared,
      };
    case "UNDEFINED_ERROR": {
      if (error.context.accessedProperty) {
        const accessedProperty = error.context.accessedProperty;
        const variableName = classified.details.variableName ?? error.context.rootObject;

        return {
          title: "Undefined Property Access",
          what: variableName
            ? `variable '${variableName}' is undefined — cannot access property '${accessedProperty}' on it.`
            : `You're trying to access property '${accessedProperty}' on an undefined value.`,
          why: variableName
            ? `'${variableName}' is undefined at this point.`
            : "The parent object is undefined at this point.",
          ...shared,
        };
      }

      const undefinedEntity = extractEntity(error.message);
      const undefinedEntityType = undefinedEntity
        ? detectEntityType(error.message)
        : "resource";

      return {
        title: "Undefined Value Accessed",
        what: undefinedEntity
          ? `${undefinedEntityType} '${undefinedEntity}' does not exist or is not available.`
          : "The command tried to use a variable or object property before it was defined.",
        why: "A value flowing into this code path is missing or was never initialized.",
        ...shared,
      };
    }
    case "FILE_NOT_FOUND": {
      const fileEntity =
        classified.details.moduleName ??
        extractEntity(error.message);
      const fileEntityType = fileEntity
        ? detectEntityType(error.message.includes("directory") ? "file" : error.message)
        : "file";

      return {
        title: "File Not Found",
        what: fileEntity
          ? `${fileEntityType} '${fileEntity}' could not be found.`
          : "A file or directory required by the command could not be found.",
        why: "The referenced path does not exist from the current working directory or the path is misspelled.",
        ...shared,
      };
    }
    case "PERMISSION_DENIED":
      return {
        title: "Permission Denied",
        what: "The command does not have permission to access the requested file, directory, or port.",
        why: "The operating system rejected the operation because of insufficient privileges or locked resources.",
        ...shared,
      };
    case "ADDRESS_IN_USE":
      return {
        title: "Address Already In Use",
        what: classified.details.port
          ? `Another process is already using port ${classified.details.port}.`
          : "Another process is already using the requested address or port.",
        why: "The service cannot bind until that port or socket is released.",
        ...shared,
      };
    case "SYNTAX_ERROR":
      return {
        title: "Syntax Problem Detected",
        what: "The runtime could not parse part of the code because the syntax is invalid.",
        why: "There is malformed JavaScript or TypeScript syntax near the reported location.",
        ...shared,
      };
    case "JSON_PARSE_ERROR":
      if (classified.details.jsonPosition !== undefined && classified.details.jsonToken) {
        return {
          title: "Invalid JSON",
          what: `Invalid JSON near position ${classified.details.jsonPosition}. Unexpected token '${classified.details.jsonToken}' detected.`,
          why: "Likely caused by an extra comma, missing quotes, or malformed structure.",
          ...shared,
        };
      }

      return {
        title: "Invalid JSON",
        what: "The command tried to parse JSON that is malformed or incomplete.",
        why: "The input contains invalid JSON syntax, a truncated payload, or unexpected characters.",
        ...shared,
      };
    case "MODULE_NOT_FOUND": {
      const moduleEntity =
        classified.details.moduleName ??
        extractEntity(error.message);

      return {
        title: "Module Not Found",
        what: moduleEntity
          ? `File '${moduleEntity}' does not exist in the current directory.`
          : "Node.js cannot locate the specified file or dependency.",
        why: moduleEntity
          ? `File '${moduleEntity}' does not exist in the current directory.`
          : "The runtime could not resolve the module path or package from the current working directory.",
        ...shared,
      };
    }
    case "HTTP_ERROR": {
      const statusCode = classified.details.statusCode ?? extractStatusCode(error.message);
      const statusCategory =
        classified.details.statusCategory ?? classifyHttpStatus(statusCode ?? null);

      return {
        title: statusCode ? `API Error (${statusCode})` : "API Error",
        what:
          statusCategory === "SERVER_ERROR"
            ? "The server failed while processing the request."
            : statusCategory === "CLIENT_ERROR"
              ? "The request was invalid or rejected by the server."
              : statusCategory === "REDIRECTION"
                ? "The request was redirected unexpectedly."
                : "The request failed due to a network or server issue.",
        why: buildHttpCause(statusCategory),
        ...shared,
      };
    }
    case "COMMAND_CONFIG_ERROR":
      return {
        title: "CLI Configuration Error",
        what: "Your CLI command is misconfigured and violates Commander.js requirements.",
        why: "passThroughOptions() requires positional options to be enabled on the parent command.",
        ...shared,
      };
    case "PROMISE_ERROR":
      return {
        title: "Unhandled Promise Error",
        what: "A promise was rejected but not handled.",
        why: "The asynchronous failure bubbled up without a surrounding try/catch or `.catch()` handler.",
        ...shared,
      };
    case "RUST_ERROR": {
      const isPanic = classified.details.systemCode === "RUST_PANIC";
      return {
        title: isPanic ? "Rust Runtime Panic" : "Rust Compilation Error",
        what: isPanic
          ? error.message
          : classified.details.systemCode && classified.details.systemCode !== "RUST_COMPILE"
            ? `Rust compiler error ${classified.details.systemCode}.`
            : "The Rust compiler rejected this code.",
        why: isPanic
          ? "A thread panicked and was not caught by a panic handler."
          : "A type error, borrow check failure, or syntax problem prevented compilation.",
        ...shared,
      };
    }
    case "JAVA_ERROR": {
      const exceptionType = classified.details.systemCode;
      return {
        title: "Java Exception",
        what: exceptionType && exceptionType !== "JAVA_EXCEPTION"
          ? `${exceptionType} was thrown.`
          : "An unhandled Java exception terminated the thread.",
        why: "An exception propagated up the call stack without being caught.",
        ...shared,
      };
    }
    case "CONVEX_FUNCTION_NOT_FOUND": {
      const keyLine = extractKeyMessage(error.message);
      const convexEntity = keyLine ? extractEntity(keyLine) : extractEntity(error.message);

      return {
        title: "Convex Function Not Found",
        what: convexEntity
          ? `function '${convexEntity}' does not exist or is not available in Convex.`
          : keyLine ?? "The requested Convex function is not available.",
        why: "The function may not be deployed yet, the local dev server is not running, or the function name / path is incorrect.",
        ...shared,
      };
    }
    case "PRISMA_ERROR": {
      const code = classified.details.systemCode;
      const prismaWhat =
        code === "P2002"
          ? "A unique constraint violation occurred — the value already exists in the database."
          : code === "P2025"
            ? "The record you are trying to read, update, or delete does not exist."
            : code === "PRISMA_INIT"
              ? "Prisma could not reach the database server."
              : "A Prisma database query failed.";
      const prismaWhy =
        code === "P2002"
          ? "Duplicate data was inserted into a column that enforces uniqueness."
          : code === "P2025"
            ? "The target record was not found — it may have been deleted or the ID is wrong."
            : code === "PRISMA_INIT"
              ? "The database URL in your .env is unreachable, misconfigured, or the server is down."
              : `Prisma error code ${code ?? "unknown"} — inspect the full message for details.`;

      return {
        title: "Database Query Failed",
        what: prismaWhat,
        why: prismaWhy,
        ...shared,
      };
    }
    case "DOCKER_ERROR": {
      const sub = classified.details.systemCode;
      return {
        title: "Docker Error",
        what:
          sub === "DOCKER_IMAGE_NOT_FOUND"
            ? "The specified Docker image could not be found locally."
            : "The Docker daemon returned an error.",
        why:
          sub === "DOCKER_IMAGE_NOT_FOUND"
            ? "The image has not been pulled yet and Docker could not find it in the configured registry."
            : "The Docker daemon may not be running, or the request was malformed.",
        ...shared,
      };
    }
    case "PYTHON_ERROR": {
      const pyEntity = extractEntity(error.message);
      const isPyImport = classified.details.systemCode === "PYTHON_IMPORT";
      return {
        title: "Python Runtime Error",
        what: isPyImport && classified.details.moduleName
          ? `Python module '${classified.details.moduleName}' is not installed.`
          : pyEntity
            ? `Python raised: ${error.message}`
            : "A Python runtime error occurred.",
        why: isPyImport
          ? "The module is missing from the active Python environment."
          : "An unhandled exception was raised during Python execution.",
        ...shared,
      };
    }
    case "GO_PANIC":
      return {
        title: "Go Runtime Panic",
        what: error.message.startsWith("panic:")
          ? error.message
          : `Go panicked: ${error.message}`,
        why: "An unrecovered panic was triggered. This is a hard crash in the Go runtime.",
        ...shared,
      };
    case "OUT_OF_MEMORY":
      return {
        title: "Out of Memory",
        what: "The process ran out of available memory and was terminated.",
        why: "The heap limit was reached. This can happen with large datasets, memory leaks, or insufficient NODE_OPTIONS.",
        ...shared,
      };
    case "DISK_FULL":
      return {
        title: "Disk Full",
        what: "There is no space left on the disk or volume.",
        why: "The target filesystem is at 100% capacity — writes are being rejected by the OS.",
        ...shared,
      };
    case "BUILD_ERROR": {
      const buildCode = classified.details.systemCode;
      return {
        title: "Build Failed",
        what:
          buildCode === "WEBPACK_BUILD"
            ? "Webpack could not build one or more modules."
            : buildCode === "GO_BUILD"
              ? "The Go build step failed due to a compilation error."
              : buildCode?.startsWith("TS")
                ? `TypeScript compilation failed (${buildCode}).`
                : "The build step failed due to a compilation error.",
        why:
          buildCode === "WEBPACK_BUILD"
            ? "A missing dependency or import path caused Webpack to abort the bundle."
            : buildCode === "GO_BUILD"
              ? "A syntax or type error in a .go file prevented compilation."
              : "A type mismatch, missing import, or invalid syntax was detected by the compiler.",
        ...shared,
      };
    }
    case "DATABASE_ERROR":
      return {
        title: "Database Connection Failed",
        what: "The application could not authenticate with or connect to the database.",
        why: "The credentials, role, or database URL are incorrect, or the Postgres server is not running.",
        ...shared,
      };
    case "PORT_CONFLICT":
      return {
        title: "Port Already In Use",
        what: classified.details.port
          ? `Another process is already listening on port ${classified.details.port}.`
          : "The requested port is already in use by another process.",
        why: "Two processes cannot bind to the same address + port simultaneously.",
        ...shared,
      };
    case "RAILS_ERROR": {
      const isAR = classified.details.systemCode?.startsWith("ActiveRecord");
      return {
        title: isAR ? "Rails Database Error" : "Rails Routing Error",
        what: isAR
          ? `ActiveRecord raised: ${error.message}`
          : `Rails could not route the request: ${error.message}`,
        why: isAR
          ? "A database query failed — the record may be missing, or a constraint was violated."
          : "No route matches the requested path or HTTP method.",
        ...shared,
      };
    }
    case "NEXTJS_ERROR":
      return {
        title: "Next.js Compilation Failed",
        what: "Next.js could not compile one or more modules.",
        why: "A missing import, unresolved path, or syntax error in a page or component caused the build to fail.",
        ...shared,
      };
    default:
      return {
        title: "Runtime Execution Error",
        what: "This error is not recognized, but the message and surrounding context are still available below.",
        why: "No known error signature matched with enough confidence to make a more specific claim.",
        ...shared,
      };
  }
}


function buildHttpCause(statusCategory: ReturnType<typeof classifyHttpStatus>): string {
  if (statusCategory === "SERVER_ERROR") {
    return "The backend or one of its dependencies failed while handling the request.";
  }

  if (statusCategory === "CLIENT_ERROR") {
    return "The request payload, route, or authentication details are likely invalid for this endpoint.";
  }

  if (statusCategory === "REDIRECTION") {
    return "The request may have been redirected unexpectedly or the target endpoint changed.";
  }

  return "The failure looks HTTP-related, but no reliable status code could be extracted.";
}
