import { ClassifiedError, classifyError, classifyHttpStatus, extractStatusCode } from "./classify";
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
    case "UNDEFINED_ERROR":
      if (error.context.accessedProperty) {
        const accessedProperty = error.context.accessedProperty;
        const variableName = classified.details.variableName ?? error.context.rootObject;

        return {
          title: "Undefined Property Access",
          what: `You're trying to access "${accessedProperty}" on an undefined object.`,
          why: variableName
            ? `'${variableName}' is undefined at this point.`
            : "The parent object is undefined at this point.",
          ...shared,
        };
      }

      return {
        title: "Undefined Value Accessed",
        what: "The command tried to use a variable or object property before it was defined.",
        why: "A value flowing into this code path is missing or was never initialized.",
        ...shared,
      };
    case "FILE_NOT_FOUND":
      return {
        title: "File Not Found",
        what: classified.details.moduleName
          ? `File '${classified.details.moduleName}' could not be found.`
          : "A file or directory required by the command could not be found.",
        why: "The referenced path does not exist from the current working directory or the path is misspelled.",
        ...shared,
      };
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
    case "MODULE_NOT_FOUND":
      return {
        title: "Module Not Found",
        what: classified.details.moduleName
          ? `File '${classified.details.moduleName}' does not exist in the current directory.`
          : "Node.js cannot locate the specified file or dependency.",
        why: classified.details.moduleName
          ? `File '${classified.details.moduleName}' does not exist in the current directory.`
          : "The runtime could not resolve the module path or package from the current working directory.",
        ...shared,
      };
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
    case "CONVEX_FUNCTION_NOT_FOUND": {
      const keyLine = extractKeyMessage(error.message);
      return {
        title: "Convex Function Not Found",
        what: keyLine
          ? keyLine
          : "The requested Convex function is not available.",
        why: "The function may not be deployed yet, the local dev server is not running, or the function name / path is incorrect.",
        ...shared,
      };
    }
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
