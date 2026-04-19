"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeError = normalizeError;
const contextEnricher_1 = require("./contextEnricher");
const stackParser_1 = require("./stackParser");
const sanitize_1 = require("../utils/sanitize");
function normalizeError(error) {
    if (error instanceof Error) {
        const message = readErrorString(error, "message") ?? "An unknown error occurred.";
        const stack = readErrorString(error, "stack");
        const type = readErrorString(error, "name") ?? "Error";
        const location = (0, stackParser_1.parseStackTrace)(stack);
        return {
            message,
            stack,
            type,
            location,
            context: (0, contextEnricher_1.enrichErrorContext)(message, location),
        };
    }
    if (typeof error === "string") {
        const sanitized = (0, sanitize_1.sanitizeErrorText)(error);
        const location = (0, stackParser_1.parseStackTrace)(sanitized);
        return {
            message: sanitized,
            stack: sanitized,
            type: "StringError",
            location,
            context: (0, contextEnricher_1.enrichErrorContext)(sanitized, location),
        };
    }
    if (typeof error === "object" && error !== null) {
        const candidate = error;
        const message = readOwnString(candidate, "message") ?? "A non-standard error object was thrown.";
        const stack = readOwnString(candidate, "stack");
        const location = (0, stackParser_1.parseStackTrace)(stack);
        return {
            message,
            stack,
            type: readOwnString(candidate, "name") ?? "UnknownObjectError",
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
function readErrorString(target, key) {
    try {
        const value = Reflect.get(target, key);
        return typeof value === "string" ? (0, sanitize_1.sanitizeErrorText)(value) : undefined;
    }
    catch {
        return undefined;
    }
}
function readOwnString(target, key) {
    if (!Object.prototype.hasOwnProperty.call(target, key)) {
        return undefined;
    }
    const descriptor = Object.getOwnPropertyDescriptor(target, key);
    if (!descriptor || typeof descriptor.get === "function") {
        return undefined;
    }
    return typeof descriptor.value === "string" ? (0, sanitize_1.sanitizeErrorText)(descriptor.value) : undefined;
}
//# sourceMappingURL=normalize.js.map