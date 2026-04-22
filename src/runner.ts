import { spawn } from "child_process";
import { classifyRawBlock } from "./engine/blockClassifier";
import { classifyError } from "./engine/classify";
import { explainError } from "./engine/explain";
import { buildFixSuggestions } from "./engine/suggest";
import { formatErrorOutput } from "./formatter/output";
import { sanitizeErrorText, sanitizeTerminalOutput } from "./utils/sanitize";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Milliseconds of stderr silence before flushing a block during long-running process. */
const DEBOUNCE_MS = 300;

/** Safety cap: flush when buffer grows beyond this many lines. */
const MAX_BUFFER_LINES = 80;

/** Suppress duplicate panels within this window (ms). */
const DEDUP_WINDOW_MS = 10_000;

/** After this many suppressions, print a single "same error ×N" notice. */
const DEDUP_NOTICE_THRESHOLD = 3;

// ─── Block-start heuristics ───────────────────────────────────────────────────

/**
 * Matches lines that signal the start of a new error block.
 * Anchored patterns prevent false positives from embedded codes or throw statements.
 */
const BLOCK_START_RE =
  /^\s*(TypeError|SyntaxError|ReferenceError|RangeError|URIError|EvalError|Error:|FATAL|FATAL ERROR|Exception in thread|Traceback \(most recent call last\)|panic:|goroutine \d+ \[|thread '.+' panicked at|error\[E\d+\]|Error response from daemon|PrismaClientKnownRequestError|PrismaClientInitializationError|error TS\d+|UnhandledPromiseRejection|ECONNREFUSED|ENOENT|EADDRINUSE|EACCES|ENOMEM|ENOSPC|ModuleNotFoundError|ImportError|NullPointerException|OutOfMemoryError|ActionController::|ActiveRecord::|Error: Failed to compile|\[ Error \])/i;

// ─── Dedup state ──────────────────────────────────────────────────────────────

interface DedupEntry {
  count: number;
  lastSeen: number;
}

// ─── Renderer ─────────────────────────────────────────────────────────────────

function renderBlock(raw: string, dedupMap: Map<string, DedupEntry>, verbose = false): boolean {
  const normalized = classifyRawBlock(raw);
  const classified = classifyError(normalized);

  // Only produce a clix panel for recognised errors (confidence > 0.5).
  if (classified.confidence <= 0.5) {
    process.stderr.write(raw.endsWith("\n") ? raw : raw + "\n");
    return false;
  }

  // ── Deduplication ──
  const key = `${classified.signatureId}:${raw.slice(0, 120)}`;
  const now = Date.now();
  const prev = dedupMap.get(key);

  if (prev && now - prev.lastSeen < DEDUP_WINDOW_MS) {
    prev.count++;
    prev.lastSeen = now;
    if (prev.count >= DEDUP_NOTICE_THRESHOLD) {
      process.stderr.write(
        `⚠️  Same error repeated ×${prev.count} — suppressing duplicates\n`,
      );
    }
    return true; // suppressed, but considered "handled"
  }

  dedupMap.set(key, { count: 1, lastSeen: now });

  const explained = explainError(normalized, classified);
  const fixes = buildFixSuggestions(classified, normalized);
  const output = formatErrorOutput(explained, normalized, classified, fixes, verbose);
  process.stderr.write(output.endsWith("\n") ? output + "\n" : output + "\n\n");
  return true;
}

// ─── Block splitter ───────────────────────────────────────────────────────────

/**
 * Splits a full stderr string into a list of error blocks + passthrough lines.
 * Returns an array of { raw: string, isBlock: boolean }.
 */
function splitIntoBlocks(rawStderr: string): Array<{ raw: string; isBlock: boolean }> {
  const lines = rawStderr.split(/\r?\n/);
  const results: Array<{ raw: string; isBlock: boolean }> = [];

  let currentBlock: string[] = [];
  let inBlock = false;

  function flushCurrentBlock(): void {
    if (currentBlock.length > 0) {
      results.push({ raw: currentBlock.join("\n"), isBlock: inBlock });
      currentBlock = [];
    }
    inBlock = false;
  }

  for (const line of lines) {
    if (!inBlock && BLOCK_START_RE.test(line)) {
      // Start a new error block (flush any preceding passthrough).
      flushCurrentBlock();
      inBlock = true;
      currentBlock.push(line);
    } else if (inBlock) {
      currentBlock.push(line);
      // Blank line after ≥3 buffered lines → block ended.
      if (line.trim() === "" && currentBlock.length >= 3) {
        flushCurrentBlock();
      }
      // Safety cap.
      if (currentBlock.length >= MAX_BUFFER_LINES) {
        flushCurrentBlock();
      }
    } else {
      // Normal passthrough line.
      currentBlock.push(line);
    }
  }

  if (currentBlock.length > 0) {
    results.push({ raw: currentBlock.join("\n"), isBlock: inBlock });
  }

  return results;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function runWrappedCommand(commandParts: string[], verbose = false): Promise<void> {
  validateCommandParts(commandParts);

  const rawCommand = buildRawCommand(commandParts);

  if (!rawCommand.trim()) {
    throw new Error("No command was provided to run.");
  }

  console.log(`⚙️ Executing: ${rawCommand}`);
  console.log(`📂 Working Dir: ${process.cwd()}`);

  await new Promise<void>((resolve, reject) => {
    const [command, ...args] = commandParts;
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: process.env,
      shell: process.platform === "win32",
      stdio: ["inherit", "pipe", "pipe"],
    });

    let rawStderr = "";
    const dedupMap = new Map<string, DedupEntry>();

    // ── Real-time debounce state (for long-running processes) ──
    let liveBuffer: string[] = [];
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let livePanelRendered = false;
    let processExited = false;

    function clearDebounce(): void {
      if (debounceTimer !== null) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
    }

    function flushLiveBuffer(): void {
      if (processExited || liveBuffer.length === 0) return;
      clearDebounce();
      const block = liveBuffer.join("\n");
      liveBuffer = [];
      if (renderBlock(block, dedupMap, verbose)) {
        livePanelRendered = true;
      }
    }

    function scheduleLiveFlush(): void {
      if (processExited) return;
      clearDebounce();
      debounceTimer = setTimeout(flushLiveBuffer, DEBOUNCE_MS);
    }

    // ── Stdout: always real-time ──
    child.stdout.pipe(process.stdout);
    child.stdout.on("data", () => {
      if (liveBuffer.length > 0) flushLiveBuffer();
    });

    // ── Stderr: buffer all, split and render at close ──
    // For long-running processes we ALSO do real-time detection.
    let stderrLineRemainder = "";

    child.stderr.on("data", (chunk: Buffer | string) => {
      const text = sanitizeErrorText(chunk.toString());
      rawStderr += text;

      // Real-time line-by-line detection for long-running servers.
      stderrLineRemainder += text;
      const parts = stderrLineRemainder.split(/\r?\n/);
      stderrLineRemainder = parts.pop() ?? "";

      for (const line of parts) {
        if (liveBuffer.length === 0 && BLOCK_START_RE.test(line)) {
          liveBuffer.push(line);
          scheduleLiveFlush();
        } else if (liveBuffer.length > 0) {
          liveBuffer.push(line);
          if (line.trim() === "" && liveBuffer.length >= 3) {
            flushLiveBuffer();
          } else if (liveBuffer.length >= MAX_BUFFER_LINES) {
            flushLiveBuffer();
          } else {
            scheduleLiveFlush();
          }
        } else {
          // Passthrough (not in a block) — write immediately.
          process.stderr.write(sanitizeTerminalOutput(line) + "\n");
        }
      }
    });

    child.on("error", reject);

    child.on("close", (code) => {
      // Gate all async paths against late-firing events.
      processExited = true;
      clearDebounce();

      if (code === 0) {
        // On clean exit, write any unconsumed stderr as-is.
        if (rawStderr.trim()) {
          process.stderr.write(sanitizeTerminalOutput(rawStderr));
        }
        resolve();
        return;
      }

      // Non-zero exit: split rawStderr into blocks and render each.
      const blocks = splitIntoBlocks(rawStderr);
      let anyPanelRendered = false;

      for (const segment of blocks) {
        if (segment.isBlock) {
          if (renderBlock(segment.raw, dedupMap, verbose)) {
            anyPanelRendered = true;
          }
        } else {
          // Passthrough lines — only write if non-empty.
          const clean = segment.raw.trim();
          if (clean) process.stderr.write(sanitizeTerminalOutput(clean) + "\n");
        }
      }

      if (!anyPanelRendered && rawStderr.trim()) {
        // No block was recognised — raw pass-through.
        process.stderr.write(sanitizeTerminalOutput(rawStderr));
      }

      process.exitCode = 1;
      resolve();
    });
  });
}

export function buildRawCommand(commandParts: string[]): string {
  return commandParts.map(quoteForShell).join(" ");
}

function validateCommandParts(commandParts: string[]): void {
  if (commandParts.length === 0 || commandParts.every((part) => !part.trim())) {
    throw new Error("No command was provided to run.");
  }

  for (const part of commandParts) {
    if (part.includes("\0")) {
      throw new Error("Command arguments cannot contain null bytes.");
    }
  }
}

function quoteForShell(value: string): string {
  if (!value) return '""';
  if (/^[A-Za-z0-9_./:=+-]+$/.test(value)) return value;
  return `"${value.replace(/(["\\])/g, "\\$1")}"`;
}
