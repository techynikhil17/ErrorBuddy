import type { NormalizedError } from "./normalize";
/**
 * Converts raw multi-line stderr text (from any runtime / language) into a
 * `NormalizedError` that the existing classify → explain → suggest pipeline
 * can handle without modification.
 */
export declare function classifyRawBlock(rawText: string, _exitCode?: number): NormalizedError;
