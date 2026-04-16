"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifyHttpStatus = exports.extractStatusCode = exports.isHttpError = void 0;
exports.classifyError = classifyError;
const signatures_1 = require("./signatures");
Object.defineProperty(exports, "classifyHttpStatus", { enumerable: true, get: function () { return signatures_1.classifyHttpStatus; } });
Object.defineProperty(exports, "extractStatusCode", { enumerable: true, get: function () { return signatures_1.extractStatusCode; } });
Object.defineProperty(exports, "isHttpError", { enumerable: true, get: function () { return signatures_1.isHttpError; } });
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
//# sourceMappingURL=classify.js.map