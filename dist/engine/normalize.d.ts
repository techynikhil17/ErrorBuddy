import { ErrorContext } from "./contextEnricher";
import { StackLocation } from "./stackParser";
export interface NormalizedError {
    message: string;
    stack?: string;
    type: string;
    location?: StackLocation;
    context: ErrorContext;
}
export declare function normalizeError(error: unknown): NormalizedError;
