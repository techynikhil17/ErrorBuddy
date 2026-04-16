import fs from "fs";

export function extractSnippet(filePath: string, lineNumber: number): string | undefined {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split(/\r?\n/);
    const snippet = lines[lineNumber - 1];
    return snippet?.trim() || undefined;
  } catch {
    return undefined;
  }
}

export function highlightSnippet(snippet: string, focus: string): string {
  if (!snippet || !focus) {
    return snippet;
  }

  const index = snippet.indexOf(focus);

  if (index === -1) {
    return snippet;
  }

  return `${snippet.slice(0, index)}👉 ${snippet.slice(index)}`;
}
