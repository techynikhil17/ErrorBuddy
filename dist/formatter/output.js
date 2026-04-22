"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isVerboseMode = isVerboseMode;
exports.formatErrorOutput = formatErrorOutput;
exports.formatSuggestionOutput = formatSuggestionOutput;
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
function isVerboseMode(errorType) {
    if (errorType === "UNKNOWN") {
        return true;
    }
    if (process.argv.includes("--verbose") || process.argv.includes("-v")) {
        return true;
    }
    const envValue = process.env.CLIX_VERBOSE?.toLowerCase();
    return envValue === "1" || envValue === "true" || envValue === "yes";
}
function formatErrorOutput(explained, normalized, classified, fixes, verbose = false) {
    return verbose || isVerboseMode(explained.category)
        ? formatVerboseErrorOutput(explained, normalized, classified, fixes)
        : formatCompactErrorOutput(explained, normalized, fixes);
}
function formatSuggestionOutput(input, suggestion) {
    const suggestionSection = suggestion.suggestion
        ? [chalk_1.default.white(`👉 ${suggestion.suggestion}`)]
        : [chalk_1.default.gray("Run with --help to see available commands.")];
    return [
        chalk_1.default.red(`❌ Unknown command: ${input}`),
        "",
        chalk_1.default.yellow(`💡 ${suggestion.heading}`),
        ...suggestionSection,
    ].join("\n");
}
function formatCompactErrorOutput(explained, normalized, fixes) {
    const location = formatLocation(normalized);
    const code = formatCodeSnippet(normalized);
    const compactFix = fixes[0] ?? "Inspect the raw error and surrounding context for the next clue.";
    return [
        chalk_1.default.red(`❌ ${explained.title}`),
        location ? chalk_1.default.cyan(`📍 ${location}`) : undefined,
        code ? chalk_1.default.white(code) : undefined,
        chalk_1.default.yellow(`💡 ${explained.why}`),
        chalk_1.default.green(`🛠 Fix: ${compactFix}`),
        chalk_1.default.gray("ℹ️ Run with eb --verbose for full details"),
    ]
        .filter((line) => Boolean(line))
        .join("\n");
}
function formatVerboseErrorOutput(explained, normalized, classified, fixes) {
    const divider = chalk_1.default.gray("══════════════════════");
    const sectionDivider = chalk_1.default.gray("──────────────");
    const location = formatLocation(normalized);
    const code = formatCodeSnippet(normalized);
    const lines = [
        divider,
        chalk_1.default.red(`❌ ${explained.title}`),
        divider,
    ];
    if (location) {
        lines.push("", chalk_1.default.cyan("📍 Location"), chalk_1.default.cyan(location));
    }
    if (code) {
        lines.push("", chalk_1.default.white("👉 Code"), chalk_1.default.white(code));
    }
    lines.push("", sectionDivider, chalk_1.default.yellow("💡 What went wrong"), explained.what, "", chalk_1.default.yellow("👉 Why"), explained.why, "", sectionDivider, chalk_1.default.green("🛠 Fix"), ...fixes.map((fix, index) => `${index + 1}. ${fix}`), "", sectionDivider, chalk_1.default.gray("🧭 Signature"), chalk_1.default.gray(`${classified.signatureId} (${Math.round(classified.confidence * 100)}% confidence)`));
    const runtimeLabel = runtimeFromType(normalized.type);
    if (runtimeLabel) {
        lines.push("", sectionDivider, chalk_1.default.gray("🌐 Runtime"), chalk_1.default.gray(runtimeLabel));
    }
    lines.push("", sectionDivider, chalk_1.default.gray("🔎 Raw Error"), chalk_1.default.gray(normalized.message));
    return lines.join("\n");
}
function formatLocation(normalized) {
    if (!normalized.location) {
        return undefined;
    }
    const relativeFile = path_1.default.relative(process.cwd(), normalized.location.file) || normalized.location.file;
    return `${relativeFile}:${normalized.location.line}`;
}
function stripLeadIn(snippet) {
    return snippet.replace(/^\s*const\s+\w+\s*=\s*/, "");
}
function formatCodeSnippet(normalized) {
    const snippet = normalized.context.highlightedSnippet ?? normalized.context.snippet;
    if (!snippet) {
        return undefined;
    }
    const cleaned = stripLeadIn(snippet);
    return cleaned.includes("👉") ? cleaned : `👉 ${cleaned}`;
}
function runtimeFromType(type) {
    const map = {
        PythonTraceback: "Python",
        GoRuntimePanic: "Go",
        JavaException: "Java / JVM",
        DockerError: "Docker",
        PrismaClientKnownRequestError: "Prisma / Node.js",
        RustError: "Rust",
        NodeError: "Node.js",
    };
    return map[type];
}
//# sourceMappingURL=output.js.map