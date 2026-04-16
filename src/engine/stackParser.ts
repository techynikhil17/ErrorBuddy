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

function isInternalFrame(file: string): boolean {
  return (
    file.includes("node:internal") ||
    file.includes("\\node_modules\\") ||
    file.includes("/node_modules/")
  );
}
