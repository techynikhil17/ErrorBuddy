"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enrichErrorContext = enrichErrorContext;
const path_1 = __importDefault(require("path"));
const rootDetector_1 = require("./rootDetector");
const snippetExtractor_1 = require("./snippetExtractor");
function enrichErrorContext(message, location) {
    const snippet = location ? (0, snippetExtractor_1.extractSnippet)(location.file, location.line) : undefined;
    const accessedProperty = extractAccessedProperty(message);
    const rootObject = snippet && accessedProperty ? (0, rootDetector_1.extractRootObject)(snippet, accessedProperty) ?? undefined : undefined;
    const variableName = extractVariableName(message, rootObject);
    const moduleName = extractModuleName(message);
    const statusCode = extractStatusCode(message) ?? undefined;
    const jsonDetails = extractJsonErrorDetails(message);
    const focusTarget = resolveFocusTarget({
        snippet,
        rootObject,
        accessedProperty,
        variableName,
        moduleName,
    });
    return {
        snippet,
        highlightedSnippet: snippet && focusTarget ? (0, snippetExtractor_1.highlightSnippet)(snippet, focusTarget) : snippet,
        accessedProperty,
        rootObject,
        variableName,
        moduleName,
        statusCode,
        jsonToken: jsonDetails?.token,
        jsonPosition: jsonDetails?.position,
    };
}
function resolveFocusTarget(input) {
    if (!input.snippet) {
        return undefined;
    }
    if (input.rootObject && input.accessedProperty) {
        return extractAccessChain(input.snippet, input.rootObject, input.accessedProperty);
    }
    if (input.variableName && input.snippet.includes(input.variableName)) {
        return input.variableName;
    }
    if (input.moduleName && input.snippet.includes(input.moduleName)) {
        return input.moduleName;
    }
    return input.accessedProperty;
}
function extractAccessedProperty(message) {
    const match = message.match(/(?:reading|property)\s+['"]([^'"]+)['"]/i);
    return match?.[1];
}
function extractVariableName(message, rootObject) {
    if (rootObject) {
        return rootObject;
    }
    const match = message.match(/['"]?([A-Za-z_$][\w$]*)['"]?\s+is not defined/i);
    return match?.[1];
}
function extractModuleName(message) {
    const quotedMatch = message.match(/Cannot find module ['"]([^'"]+)['"]/i);
    if (!quotedMatch) {
        return undefined;
    }
    const fullTarget = quotedMatch[1];
    return path_1.default.basename(fullTarget) || fullTarget;
}
function extractStatusCode(message) {
    const match = message.match(/status code (\d{3})/i);
    if (!match) {
        return undefined;
    }
    const statusCode = Number(match[1]);
    return Number.isNaN(statusCode) ? undefined : statusCode;
}
function extractJsonErrorDetails(message) {
    const match = message.match(/Unexpected token\s+(.+?)\s+in JSON at position\s+(\d+)/i);
    if (!match) {
        return undefined;
    }
    const [, token, positionText] = match;
    const position = Number(positionText);
    return {
        token: token?.trim(),
        position: Number.isNaN(position) ? undefined : position,
    };
}
function extractAccessChain(snippet, rootObject, property) {
    const escapedRoot = escapeForRegex(rootObject);
    const escapedProperty = escapeForRegex(property);
    const chainMatch = snippet.match(new RegExp(String.raw `\b${escapedRoot}(?:\??\.\s*[A-Za-z_$][\w$]*)*\.\s*${escapedProperty}(?:\??\.\s*[A-Za-z_$][\w$]*)*`));
    return chainMatch?.[0]?.replace(/\s+/g, " ");
}
function escapeForRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
//# sourceMappingURL=contextEnricher.js.map