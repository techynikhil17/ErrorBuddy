"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseStackTrace = parseStackTrace;
function parseStackTrace(stack) {
    if (!stack) {
        return undefined;
    }
    const lines = stack.split("\n").map((line) => line.trim());
    for (const line of lines) {
        const match = line.match(/\(?((?:[A-Za-z]:)?[^():]+(?:\\|\/)[^():]+):(\d+):(\d+)\)?$/);
        if (!match) {
            continue;
        }
        const [, rawFile, lineNumber, columnNumber] = match;
        const file = rawFile.replace(/^\(/, "");
        if (isInternalFrame(file)) {
            continue;
        }
        return {
            file,
            line: Number(lineNumber),
            column: Number(columnNumber),
        };
    }
    return undefined;
}
function isInternalFrame(file) {
    return (file.includes("node:internal") ||
        file.includes("\\node_modules\\") ||
        file.includes("/node_modules/"));
}
//# sourceMappingURL=stackParser.js.map