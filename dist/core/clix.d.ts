import { Command } from "commander";
type CommandRegistrationOptions = {
    hidden?: boolean;
};
export declare class ClixApp {
    private readonly program;
    private readonly commandNames;
    constructor(name?: string);
    command(name: string, descriptionOrOptions?: string | CommandRegistrationOptions): Command;
    run(argv?: string[]): Promise<void>;
    private renderError;
}
export declare function clix(): ClixApp;
export declare function renderClixError(error: unknown): void;
export declare function installGlobalErrorHandlers(): void;
export {};
