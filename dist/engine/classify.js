"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifyError = classifyError;
exports.isHttpError = isHttpError;
exports.extractStatusCode = extractStatusCode;
exports.classifyHttpStatus = classifyHttpStatus;
const signatures_1 = require("./signatures");
function classifyError(error) {
    const bestMatch = signatures_1.ERROR_SIGNATURES
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
function isHttpError(message) {
    return (message.includes("Request failed with status code") ||
        message.includes("Network response was not ok") ||
        (message.includes("AxiosError") && message.includes("status")));
}
function extractStatusCode(message) {
    const match = message.match(/status code (\d{3})/i);
    return match ? parseInt(match[1], 10) : null;
}
function classifyHttpStatus(status) {
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
//# sourceMappingURL=classify.js.map