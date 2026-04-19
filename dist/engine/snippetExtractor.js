"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractSnippet = extractSnippet;
exports.highlightSnippet = highlightSnippet;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const MAX_SNIPPET_FILE_SIZE_BYTES = 1024 * 1024;
function extractSnippet(filePath, lineNumber) {
    try {
        const safePath = resolveWorkspaceFile(filePath);
        if (!safePath || lineNumber < 1) {
            return undefined;
        }
        const stats = fs_1.default.statSync(safePath);
        if (!stats.isFile() || stats.size > MAX_SNIPPET_FILE_SIZE_BYTES) {
            return undefined;
        }
        const content = fs_1.default.readFileSync(safePath, "utf8");
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
function resolveWorkspaceFile(filePath) {
    const workspaceRoot = path_1.default.resolve(process.cwd());
    const resolvedPath = path_1.default.resolve(filePath);
    let realPath;
    try {
        realPath = fs_1.default.realpathSync(resolvedPath);
    }
    catch {
        return undefined;
    }
    if (!isWithinWorkspace(realPath, workspaceRoot)) {
        return undefined;
    }
    return realPath;
}
function isWithinWorkspace(candidatePath, workspaceRoot) {
    const relativePath = path_1.default.relative(workspaceRoot, candidatePath);
    return relativePath === "" || (!relativePath.startsWith("..") && !path_1.default.isAbsolute(relativePath));
}
//# sourceMappingURL=snippetExtractor.js.map