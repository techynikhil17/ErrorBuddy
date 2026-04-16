import { StackLocation } from "./stackParser";
export interface ErrorContext {
    snippet?: string;
    highlightedSnippet?: string;
    accessedProperty?: string;
    rootObject?: string;
    variableName?: string;
    moduleName?: string;
    statusCode?: number;
    jsonToken?: string;
    jsonPosition?: number;
    port?: number;
}
export declare function enrichErrorContext(message: string, location?: StackLocation): ErrorContext;
