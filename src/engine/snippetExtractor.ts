import fs from "fs";
import path from "path";

const MAX_SNIPPET_FILE_SIZE_BYTES = 1024 * 1024;

export function extractSnippet(filePath: string, lineNumber: number): string | undefined {
  try {
    const safePath = resolveWorkspaceFile(filePath);

    if (!safePath || lineNumber < 1) {
      return undefined;
    }

    const stats = fs.statSync(safePath);

    if (!stats.isFile() || stats.size > MAX_SNIPPET_FILE_SIZE_BYTES) {
      return undefined;
    }

    const content = fs.readFileSync(safePath, "utf8");
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

function resolveWorkspaceFile(filePath: string): string | undefined {
  const workspaceRoot = path.resolve(process.cwd());
  const resolvedPath = path.resolve(filePath);

  let realPath: string;
  try {
    realPath = fs.realpathSync(resolvedPath);
  } catch {
    return undefined;
  }

  if (!isWithinWorkspace(realPath, workspaceRoot)) {
    return undefined;
  }

  return realPath;
}

function isWithinWorkspace(candidatePath: string, workspaceRoot: string): boolean {
  const relativePath = path.relative(workspaceRoot, candidatePath);
  return relativePath === "" || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath));
}
