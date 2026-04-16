import { ClassifiedError } from "./classify";
import { NormalizedError } from "./normalize";
export interface ExplainedError {
    title: string;
    what: string;
    why: string;
    category: string;
    confidence: number;
    signatureId: string;
}
export declare function explainError(error: NormalizedError, classified?: ClassifiedError): ExplainedError;
