"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractRootObject = extractRootObject;
function extractRootObject(snippet, property) {
    const escapedProperty = escapeForRegex(property);
    const memberPattern = new RegExp(String.raw `([A-Za-z_$][\w$]*)\s*\.\s*${escapedProperty}\b`);
    const optionalChainPattern = new RegExp(String.raw `([A-Za-z_$][\w$]*)\s*\?\.\s*${escapedProperty}\b`);
    const memberMatch = snippet.match(memberPattern) ?? snippet.match(optionalChainPattern);
    return memberMatch?.[1] ?? null;
}
function escapeForRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
//# sourceMappingURL=rootDetector.js.map