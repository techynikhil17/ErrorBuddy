import { Command } from "commander";
export declare class ClixApp {
    private readonly program;
    private readonly commandNames;
    constructor(name?: string);
    command(name: string, description?: string): Command;
    run(argv?: string[]): Promise<void>;
    private renderError;
}
export declare function clix(): ClixApp;
export declare function renderClixError(error: unknown): void;
export declare function installGlobalErrorHandlers(): void;
