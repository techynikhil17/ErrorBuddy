import { ClassifiedError, classifyHttpStatus, extractStatusCode } from "./classify";
import { NormalizedError } from "./normalize";

export interface SuggestionMessage {
  heading: string;
  suggestion?: string;
}

export function buildSuggestionText(suggestedCommand?: string): SuggestionMessage {
  if (!suggestedCommand) {
    return {
      heading: "No close match was found.",
    };
  }

  return {
    heading: "Did you mean:",
    suggestion: suggestedCommand,
  };
}

export function buildFixSuggestions(
  classified: ClassifiedError,
  error: NormalizedError,
): string[] {
  switch (classified.category) {
    case "UNDEFINED_ERROR":
      return buildUndefinedFixes(error);
    case "NETWORK_ERROR":
      return [
        "Check internet connection, API availability, or CORS configuration.",
        "Retry the request after confirming the target server is reachable.",
      ];
    case "CONNECTION_REFUSED":
      return [
        classified.details.port
          ? `Start the service listening on port ${classified.details.port}.`
          : "Start the target service and verify the host and port.",
        "Confirm the connection string matches the service that should be running.",
      ];
    case "FILE_NOT_FOUND":
      return [
        "Verify the file or directory path relative to the current working directory.",
        "Create the missing path or update the command to point at the correct location.",
      ];
    case "PERMISSION_DENIED":
      return [
        "Run the command with the required permissions or adjust file access rights.",
        "Close any process that may be locking the file, directory, or port.",
      ];
    case "ADDRESS_IN_USE":
      return [
        "Stop the process already using the port, or configure this service to use a different one.",
        "Inspect your local processes to see what is bound to the conflicting address.",
      ];
    case "SYNTAX_ERROR":
      return [
        "Inspect the reported line for missing punctuation, mismatched brackets, or malformed syntax.",
        "Run the file through TypeScript or your linter to pinpoint the invalid token.",
      ];
    case "JSON_PARSE_ERROR":
      return [
        "Validate the JSON payload before parsing it.",
        "Check for trailing commas, missing quotes, or truncated input.",
      ];
    case "MODULE_NOT_FOUND":
      return [
        "Ensure the file path is correct or install the required dependency.",
        "Run the command from the project directory that contains the target file or package.",
      ];
    case "HTTP_ERROR":
      return buildHttpFixes(error.message);
    case "COMMAND_CONFIG_ERROR":
      return [
        "Add `program.enablePositionalOptions();` before defining commands.",
        "Keep `.passThroughOptions()` only on commands whose parent has positional options enabled.",
      ];
    case "PROMISE_ERROR":
      return [
        "Add `.catch()` to handle the rejection.",
        "Or use try/catch with async/await.",
      ];
    case "CONVEX_FUNCTION_NOT_FOUND":
      return [
        "Run `npx convex dev` to start the local Convex development server.",
        "Check the function name and path — it must exactly match the exported function in your `convex/` directory.",
        "Ensure the function is exported correctly (e.g. `export const myFn = query(...)`).",
      ];
    default:
      return [
        "Search for the exact error message and inspect the raw context below.",
        "Add targeted logging around the failing step to narrow down the cause.",
      ];
  }
}

function buildUndefinedFixes(error: NormalizedError): string[] {
  const optionalChainExample = buildOptionalChain(
    error.context.snippet,
    error.context.rootObject,
    error.context.accessedProperty,
  );
  const guardTarget = error.context.rootObject ?? "value";

  return [
    `Use optional chaining: ${optionalChainExample ?? "value?.property"}`,
    `Add a guard before access: if (${guardTarget}) { /* safe access */ }`,
  ];
}

function buildOptionalChain(
  snippet?: string,
  rootObject?: string,
  property?: string,
): string | undefined {
  if (!snippet || !rootObject || !property) {
    return undefined;
  }

  const assignmentIndex = snippet.indexOf("=");
  const expression = assignmentIndex >= 0 ? snippet.slice(assignmentIndex + 1).trim() : snippet.trim();

  if (!expression.includes(rootObject) || !expression.includes(property)) {
    return undefined;
  }

  return expression.replace(/\.(\s*[A-Za-z_$][\w$]*)/g, "?.$1");
}

function buildHttpFixes(message: string): string[] {
  const statusCode = extractStatusCode(message);
  const statusCategory = classifyHttpStatus(statusCode);

  if (statusCategory === "SERVER_ERROR") {
    return [
      "Check backend logs or the API handler. This is likely a server-side issue.",
      "Retry only after the service or dependency health is restored.",
    ];
  }

  if (statusCategory === "CLIENT_ERROR") {
    return [
      "Verify request payload, headers, authentication, and endpoint URL.",
      "Confirm the API contract matches what the server expects.",
    ];
  }

  return [
    "Check network connectivity or retry the request.",
    "Inspect the raw response details to see whether a redirect or proxy issue is involved.",
  ];
}
