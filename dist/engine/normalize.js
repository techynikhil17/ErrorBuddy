"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeError = normalizeError;
const contextEnricher_1 = require("./contextEnricher");
const stackParser_1 = require("./stackParser");
function normalizeError(error) {
    if (error instanceof Error) {
        const location = (0, stackParser_1.parseStackTrace)(error.stack);
        return {
            message: error.message || "An unknown error occurred.",
            stack: error.stack,
            type: error.name || "Error",
            location,
            context: (0, contextEnricher_1.enrichErrorContext)(error.message, location),
        };
    }
    if (typeof error === "string") {
        const location = (0, stackParser_1.parseStackTrace)(error);
        return {
            message: error,
            stack: error,
            type: "StringError",
            location,
            context: (0, contextEnricher_1.enrichErrorContext)(error, location),
        };
    }
    if (typeof error === "object" && error !== null) {
        const candidate = error;
        const message = typeof candidate.message === "string"
            ? candidate.message
            : "A non-standard error object was thrown.";
        const stack = typeof candidate.stack === "string" ? candidate.stack : undefined;
        const location = (0, stackParser_1.parseStackTrace)(stack);
        return {
            message,
            stack,
            type: typeof candidate.name === "string" ? candidate.name : "UnknownObjectError",
            location,
            context: (0, contextEnricher_1.enrichErrorContext)(message, location),
        };
    }
    return {
        message: `A non-error value was thrown: ${String(error)}`,
        type: typeof error,
        context: {},
    };
}
//# sourceMappingURL=normalize.js.map