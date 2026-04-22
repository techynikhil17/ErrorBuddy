import chalk from "chalk";
import path from "path";
import { ClassifiedError } from "../engine/classify";
import { ExplainedError } from "../engine/explain";
import { NormalizedError } from "../engine/normalize";
import { SuggestionMessage } from "../engine/suggest";

export function isVerboseMode(errorType?: string): boolean {
  if (errorType === "UNKNOWN") {
    return true;
  }

  if (process.argv.includes("--verbose") || process.argv.includes("-v")) {
    return true;
  }

  const envValue = process.env.CLIX_VERBOSE?.toLowerCase();
  return envValue === "1" || envValue === "true" || envValue === "yes";
}

export function formatErrorOutput(
  explained: ExplainedError,
  normalized: NormalizedError,
  classified: ClassifiedError,
  fixes: string[],
  verbose = false,
): string {
  return verbose || isVerboseMode(explained.category)
    ? formatVerboseErrorOutput(explained, normalized, classified, fixes)
    : formatCompactErrorOutput(explained, normalized, fixes);
}

export function formatSuggestionOutput(input: string, suggestion: SuggestionMessage): string {
  const suggestionSection = suggestion.suggestion
    ? [chalk.white(`👉 ${suggestion.suggestion}`)]
    : [chalk.gray("Run with --help to see available commands.")];

  return [
    chalk.red(`❌ Unknown command: ${input}`),
    "",
    chalk.yellow(`💡 ${suggestion.heading}`),
    ...suggestionSection,
  ].join("\n");
}

function formatCompactErrorOutput(
  explained: ExplainedError,
  normalized: NormalizedError,
  fixes: string[],
): string {
  const location = formatLocation(normalized);
  const code = formatCodeSnippet(normalized);
  const compactFix = fixes[0] ?? "Inspect the raw error and surrounding context for the next clue.";

  return [
    chalk.red(`❌ ${explained.title}`),
    location ? chalk.cyan(`📍 ${location}`) : undefined,
    code ? chalk.white(code) : undefined,
    chalk.yellow(`💡 ${explained.why}`),
    chalk.green(`🛠 Fix: ${compactFix}`),
    chalk.gray("ℹ️ Run with eb --verbose for full details"),
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");
}

function formatVerboseErrorOutput(
  explained: ExplainedError,
  normalized: NormalizedError,
  classified: ClassifiedError,
  fixes: string[],
): string {
  const divider = chalk.gray("══════════════════════");
  const sectionDivider = chalk.gray("──────────────");
  const location = formatLocation(normalized);
  const code = formatCodeSnippet(normalized);

  const lines = [
    divider,
    chalk.red(`❌ ${explained.title}`),
    divider,
  ];

  if (location) {
    lines.push("", chalk.cyan("📍 Location"), chalk.cyan(location));
  }

  if (code) {
    lines.push("", chalk.white("👉 Code"), chalk.white(code));
  }

  lines.push(
    "",
    sectionDivider,
    chalk.yellow("💡 What went wrong"),
    explained.what,
    "",
    chalk.yellow("👉 Why"),
    explained.why,
    "",
    sectionDivider,
    chalk.green("🛠 Fix"),
    ...fixes.map((fix, index) => `${index + 1}. ${fix}`),
    "",
    sectionDivider,
    chalk.gray("🧭 Signature"),
    chalk.gray(`${classified.signatureId} (${Math.round(classified.confidence * 100)}% confidence)`),
  );

  const runtimeLabel = runtimeFromType(normalized.type);

  if (runtimeLabel) {
    lines.push(
      "",
      sectionDivider,
      chalk.gray("🌐 Runtime"),
      chalk.gray(runtimeLabel),
    );
  }

  lines.push(
    "",
    sectionDivider,
    chalk.gray("🔎 Raw Error"),
    chalk.gray(normalized.message),
  );

  return lines.join("\n");
}

function formatLocation(normalized: NormalizedError): string | undefined {
  if (!normalized.location) {
    return undefined;
  }

  const relativeFile = path.relative(process.cwd(), normalized.location.file) || normalized.location.file;
  return `${relativeFile}:${normalized.location.line}`;
}

function stripLeadIn(snippet: string): string {
  return snippet.replace(/^\s*const\s+\w+\s*=\s*/, "");
}

function formatCodeSnippet(normalized: NormalizedError): string | undefined {
  const snippet = normalized.context.highlightedSnippet ?? normalized.context.snippet;

  if (!snippet) {
    return undefined;
  }

  const cleaned = stripLeadIn(snippet);
  return cleaned.includes("👉") ? cleaned : `👉 ${cleaned}`;
}

function runtimeFromType(type: string): string | undefined {
  const map: Record<string, string> = {
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
