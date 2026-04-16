import { findClosestCommand } from "../utils/levenshtein";

export interface InvalidCommandResult {
  enteredCommand: string;
  suggestedCommand?: string;
}

export function resolveInputCommandName(argv: string[]): string | undefined {
  const args = argv.slice(2);

  for (const arg of args) {
    if (!arg.startsWith("-")) {
      return arg;
    }
  }

  return undefined;
}

export function buildInvalidCommandResult(
  enteredCommand: string,
  validCommands: string[],
): InvalidCommandResult | undefined {
  if (!enteredCommand || validCommands.includes(enteredCommand)) {
    return undefined;
  }

  return {
    enteredCommand,
    suggestedCommand: findClosestCommand(enteredCommand, validCommands),
  };
}
