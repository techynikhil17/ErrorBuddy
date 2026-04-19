const MAX_ERROR_TEXT_LENGTH = 50 * 1024;

export function sanitizeTerminalOutput(input: string): string {
  return stripControlCharacters(stripUnsafeAnsiSequences(input));
}

export function sanitizeErrorText(input: string, maxLength = MAX_ERROR_TEXT_LENGTH): string {
  const sanitized = sanitizeTerminalOutput(input);

  if (sanitized.length <= maxLength) {
    return sanitized;
  }

  return `${sanitized.slice(0, maxLength)}\n… [truncated by errbuddy]`;
}

function stripUnsafeAnsiSequences(input: string): string {
  return input
    .replace(/\u001B\][^\u0007\u001B]*(?:\u0007|\u001B\\)/g, "")
    .replace(/\u001B\[[0-9;?]*[ -/]*[@-~]/g, (sequence) =>
      isSafeSgrSequence(sequence) ? sequence : "",
    );
}

function isSafeSgrSequence(sequence: string): boolean {
  return /^\u001B\[[0-9;]*m$/.test(sequence);
}

function stripControlCharacters(input: string): string {
  return input.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001A\u001C-\u001F\u007F]/g, "");
}
