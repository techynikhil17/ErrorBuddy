"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractSnippet = extractSnippet;
exports.highlightSnippet = highlightSnippet;
const fs_1 = __importDefault(require("fs"));
function extractSnippet(filePath, lineNumber) {
    try {
        const content = fs_1.default.readFileSync(filePath, "utf8");
        const lines = content.split(/\r?\n/);
        const snippet = lines[lineNumber - 1];
        return snippet?.trim() || undefined;
    }
    catch {
        return undefined;
    }
}
function highlightSnippet(snippet, focus) {
    if (!snippet || !focus) {
        return snippet;
    }
    const index = snippet.indexOf(focus);
    if (index === -1) {
        return snippet;
    }
    return `${snippet.slice(0, index)}👉 ${snippet.slice(index)}`;
}
//# sourceMappingURL=snippetExtractor.js.map