export interface StackLocation {
  file: string;
  line: number;
  column?: number;
}

export function parseStackTrace(stack?: string): StackLocation | undefined {
  if (!stack) {
    return undefined;
  }

  const lines = stack.split("\n").map((line) => line.trim());

  for (const line of lines) {
    const location = parseStackFrame(line);

    if (!location || isInternalFrame(location.file)) {
      continue;
    }

    return location;
  }

  return undefined;
}

function parseStackFrame(line: string): StackLocation | undefined {
  if (!line) {
    return undefined;
  }

  let candidate = line.startsWith("at ") ? line.slice(3).trim() : line;

  if (candidate.endsWith(")") && candidate.includes("(")) {
    candidate = candidate.slice(candidate.lastIndexOf("(") + 1, -1);
  }

  const suffixMatch = candidate.match(/:(\d+):(\d+)$/);

  if (!suffixMatch) {
    return undefined;
  }

  const file = candidate.slice(0, -suffixMatch[0].length).replace(/^\(/, "").trim();

  if (!file || (!file.includes("\\") && !file.includes("/"))) {
    return undefined;
  }

  return {
    file,
    line: Number(suffixMatch[1]),
    column: Number(suffixMatch[2]),
  };
}

function isInternalFrame(file: string): boolean {
  return (
    file.includes("node:internal") ||
    file.includes("\\node_modules\\") ||
    file.includes("/node_modules/")
  );
}
