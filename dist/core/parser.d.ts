export interface InvalidCommandResult {
    enteredCommand: string;
    suggestedCommand?: string;
}
export declare function resolveInputCommandName(argv: string[]): string | undefined;
export declare function buildInvalidCommandResult(enteredCommand: string, validCommands: string[]): InvalidCommandResult | undefined;
