"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSuggestionText = buildSuggestionText;
exports.buildFixSuggestions = buildFixSuggestions;
const classify_1 = require("./classify");
function buildSuggestionText(suggestedCommand) {
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
function buildFixSuggestions(classified, error) {
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
        case "RUST_ERROR":
            if (classified.details.systemCode === "RUST_PANIC") {
                return [
                    "Read the panic message and file/line above to find the source.",
                    "Add `RUST_BACKTRACE=1` before your command for a full stack trace.",
                    "Use `unwrap_or`, `unwrap_or_else`, or `?` to handle Results gracefully instead of panicking.",
                ];
            }
            return [
                "Read the compiler error code — Rust error codes have detailed explanations: `rustc --explain E<CODE>`",
                "Run `cargo check` for a faster feedback loop than a full build.",
                "Check the borrow checker: ensure references don't outlive their owners.",
            ];
        case "JAVA_ERROR":
            return [
                "Read the 'Caused by:' line in the stack trace — that is the root cause.",
                "Wrap the failing call in a try/catch block.",
                "Add `-XX:+PrintGCDetails` or increase heap with `-Xmx` if the issue is memory-related.",
            ];
        case "CONVEX_FUNCTION_NOT_FOUND":
            return [
                "Run `npx convex dev` to start the local Convex development server.",
                "Check the function name and path — it must exactly match the exported function in your `convex/` directory.",
                "Ensure the function is exported correctly (e.g. `export const myFn = query(...)`).",
            ];
        case "PRISMA_ERROR": {
            const code = classified.details.systemCode;
            if (code === "P2002") {
                return [
                    "A record with this value already exists. Check for duplicate data before inserting.",
                    "Use `upsert` instead of `create` if the record may already exist.",
                ];
            }
            if (code === "P2025") {
                return [
                    "The record you're trying to update or delete does not exist. Verify the ID.",
                    "Add a `findUnique` check before the mutation to confirm the record is present.",
                ];
            }
            if (code === "PRISMA_INIT") {
                return [
                    "Check your DATABASE_URL in .env and confirm the database server is running.",
                    "Run `npx prisma migrate dev` to ensure the database is initialised.",
                ];
            }
            return [
                "Inspect the Prisma error code in the message and consult https://www.prisma.io/docs/reference/api-reference/error-reference.",
                "Run `npx prisma studio` to inspect the database state visually.",
            ];
        }
        case "DOCKER_ERROR":
            return [
                "Run `docker ps` to check whether the Docker daemon is running.",
                "Run `docker pull <image>` to pull the missing image before starting the container.",
                "Run `docker system prune` to free up space if the issue is disk-related.",
            ];
        case "PYTHON_ERROR":
            if (classified.details.systemCode === "PYTHON_IMPORT") {
                return [
                    `Run \`pip install ${classified.details.moduleName ?? "<module>"}\` to install the missing package.`,
                    "Activate the correct virtual environment: `source .venv/bin/activate` (or `.venv\\Scripts\\activate` on Windows).",
                ];
            }
            return [
                "Read the full Python traceback above to find the file and line number.",
                "Add a try/except block around the failing code to handle the exception gracefully.",
            ];
        case "GO_PANIC":
            return [
                "Read the goroutine dump above to find the exact line that panicked.",
                "Add `recover()` inside a deferred function to catch the panic if it is expected.",
                "Check for nil pointer dereferences and index-out-of-range accesses.",
            ];
        case "OUT_OF_MEMORY":
            return [
                "Increase the Node.js heap: `NODE_OPTIONS=--max-old-space-size=4096 <cmd>`",
                "Profile memory usage with `node --inspect` and Chrome DevTools to find the leak.",
                "Process large datasets in smaller chunks instead of loading them all at once.",
            ];
        case "DISK_FULL":
            return [
                "Run `df -h` (Linux/Mac) or `Get-PSDrive` (Windows) to find which volume is full.",
                "Clear Docker images and containers: `docker system prune -af`.",
                "Remove build artefacts and caches: `rm -rf node_modules dist .cache`.",
            ];
        case "BUILD_ERROR":
            return [
                "Fix the reported type or syntax error in the source file, then rebuild.",
                "Run `npx tsc --noEmit` for a full diagnostic listing of all type errors.",
                classified.details.systemCode === "WEBPACK_BUILD"
                    ? "Run `npm install` to ensure all dependencies referenced in the bundle are present."
                    : "Check that all imported modules are installed and paths are spelled correctly.",
            ];
        case "DATABASE_ERROR":
            return [
                "Check your DATABASE_URL in .env — it must match a running Postgres instance.",
                "Run `psql -U postgres` to verify the role exists and the server is accepting connections.",
                "Confirm the database user has been granted the necessary privileges.",
            ];
        case "PORT_CONFLICT":
            return [
                classified.details.port
                    ? `Stop the process using port ${classified.details.port}: find it with \`lsof -i :${classified.details.port}\` (Mac/Linux) or \`netstat -ano | findstr :${classified.details.port}\` (Windows).`
                    : "Find and stop the conflicting process with `lsof -i` or `netstat -ano`.",
                "Or configure this service to listen on a different port.",
            ];
        case "RAILS_ERROR":
            return [
                "Run `rails routes` to see all available routes and their requirements.",
                "Check the ActiveRecord error message — it usually includes the table name and constraint.",
                "Run `rails db:migrate` if you recently added a migration.",
            ];
        case "NEXTJS_ERROR":
            return [
                "Check the import path — Next.js is strict about case sensitivity on Linux.",
                "Run `npm install` to ensure all dependencies are present.",
                "Look for `@/` alias misconfigurations in `tsconfig.json` `paths`.",
            ];
        default:
            return [
                "Search for the exact error message and inspect the raw context below.",
                "Add targeted logging around the failing step to narrow down the cause.",
            ];
    }
}
function buildUndefinedFixes(error) {
    const optionalChainExample = buildOptionalChain(error.context.snippet, error.context.rootObject, error.context.accessedProperty);
    const guardTarget = error.context.rootObject ?? "value";
    return [
        `Use optional chaining: ${optionalChainExample ?? "value?.property"}`,
        `Add a guard before access: if (${guardTarget}) { /* safe access */ }`,
    ];
}
function buildOptionalChain(snippet, rootObject, property) {
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
function buildHttpFixes(message) {
    const statusCode = (0, classify_1.extractStatusCode)(message);
    const statusCategory = (0, classify_1.classifyHttpStatus)(statusCode);
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
//# sourceMappingURL=suggest.js.map