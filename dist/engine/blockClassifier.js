"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifyRawBlock = classifyRawBlock;
// ─── Runtime detection ────────────────────────────────────────────────────────
function detectRuntime(raw) {
    if (/Traceback \(most recent call last\):|File ".+?\.py", line/i.test(raw)) {
        return "python";
    }
    if (/goroutine \d+ \[|panic:|\.go:\d+/i.test(raw)) {
        return "go";
    }
    if (/Exception in thread|at com\.|at java\./i.test(raw)) {
        return "java";
    }
    if (/Error response from daemon:|^docker:/im.test(raw)) {
        return "docker";
    }
    if (/PrismaClientKnownRequestError|PrismaClientInitializationError|\bP\d{4}\b/i.test(raw)) {
        return "prisma";
    }
    return "node";
}
// ─── Error-type mapping ───────────────────────────────────────────────────────
function runtimeToErrorType(runtime) {
    switch (runtime) {
        case "python": return "PythonTraceback";
        case "go": return "GoRuntimePanic";
        case "java": return "JavaException";
        case "docker": return "DockerError";
        case "prisma": return "PrismaClientKnownRequestError";
        case "node": return "NodeError";
    }
}
// ─── Signal-line extraction ───────────────────────────────────────────────────
/** Priority patterns — first match wins. */
const SIGNAL_PATTERNS = [
    /^error:/i,
    /^exception:/i,
    /^fatal:/i,
    /^panic:/i,
    /^error\[/i, // Rust-style  error[E0308]
    /Error:/, // mid-line  "TypeError: …"
    /Exception:/,
    /FATAL:/,
];
/** Matches lines that look like stack-frame noise. */
const STACK_FRAME_RE = /^\s*(at\s+|goroutine\s+\d+|File\s+"|from\s+\/|#\d+\s+0x)/i;
function extractSignalLine(lines, runtime) {
    // 1. Explicit high-signal line
    for (const line of lines) {
        if (SIGNAL_PATTERNS.some((re) => re.test(line))) {
            return line.trim();
        }
    }
    // 2. For Python: last non-stack-frame line (the exception line)
    if (runtime === "python") {
        for (let i = lines.length - 1; i >= 0; i--) {
            const t = lines[i].trim();
            if (t && !STACK_FRAME_RE.test(t))
                return t;
        }
    }
    // 3. First non-empty, non-stack-frame line
    for (const line of lines) {
        const t = line.trim();
        if (t && !STACK_FRAME_RE.test(t))
            return t;
    }
    // 4. Absolute fallback: first line
    return lines[0]?.trim() ?? "Unknown error";
}
// ─── Context helpers ──────────────────────────────────────────────────────────
function extractPortFromText(text) {
    const match = text.match(/:(\d{2,5})\b/);
    if (!match)
        return undefined;
    const port = Number(match[1]);
    return Number.isNaN(port) ? undefined : port;
}
function extractModuleFromText(text) {
    // Python: No module named 'foo'
    const pyMatch = text.match(/No module named ['"]([^'"]+)['"]/i);
    if (pyMatch)
        return pyMatch[1];
    // Node: Cannot find module 'foo'
    const nodeMatch = text.match(/Cannot find module ['"]([^'"]+)['"]/i);
    if (nodeMatch)
        return nodeMatch[1];
    return undefined;
}
function extractStatusCodeFromText(text) {
    const match = text.match(/status code (\d{3})/i);
    if (!match)
        return undefined;
    const code = Number(match[1]);
    return Number.isNaN(code) ? undefined : code;
}
// ─── Public API ───────────────────────────────────────────────────────────────
/**
 * Converts raw multi-line stderr text (from any runtime / language) into a
 * `NormalizedError` that the existing classify → explain → suggest pipeline
 * can handle without modification.
 */
function classifyRawBlock(rawText, _exitCode) {
    const lines = rawText.split(/\r?\n/).filter((l) => l.trim());
    const runtime = detectRuntime(rawText);
    const signalLine = extractSignalLine(lines, runtime);
    return {
        message: signalLine,
        stack: rawText,
        type: runtimeToErrorType(runtime),
        context: {
            moduleName: extractModuleFromText(rawText),
            port: extractPortFromText(rawText),
            statusCode: extractStatusCodeFromText(rawText),
        },
    };
}
//# sourceMappingURL=blockClassifier.js.map