import type { ErrorCategory, HttpStatusCategory } from "./classify";
import type { NormalizedError } from "./normalize";
export interface SignatureExtract {
    systemCode?: string;
    statusCode?: number;
    statusCategory?: HttpStatusCategory;
    moduleName?: string;
    variableName?: string;
    propertyName?: string;
    jsonToken?: string;
    jsonPosition?: number;
    port?: number;
    promiseType?: string;
}
export interface ErrorSignature {
    id: string;
    category: ErrorCategory;
    confidence: number;
    match: (error: NormalizedError) => boolean;
    extract: (error: NormalizedError) => SignatureExtract;
}
export declare const ERROR_SIGNATURES: ErrorSignature[];
/**
 * Scans a (potentially multi-line) error message and returns the first line
 * that contains a high-signal keyword.  This lets clix surface the most
 * useful sentence from a long, noisy Convex / Django / framework stack trace
 * instead of dumping the whole blob at the user.
 *
 * Keywords checked (case-insensitive):
 *   "Could not find" | "Did you forget" | "not found" | "failed"
 */
export declare function extractKeyMessage(msg: string): string | null;
