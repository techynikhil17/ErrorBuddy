import { NormalizedError } from "./normalize";
import { SignatureExtract } from "./signatures";
export type ErrorCategory = "NETWORK_ERROR" | "CONNECTION_REFUSED" | "UNDEFINED_ERROR" | "SYNTAX_ERROR" | "JSON_PARSE_ERROR" | "MODULE_NOT_FOUND" | "FILE_NOT_FOUND" | "PERMISSION_DENIED" | "ADDRESS_IN_USE" | "HTTP_ERROR" | "COMMAND_CONFIG_ERROR" | "PROMISE_ERROR" | "CONVEX_FUNCTION_NOT_FOUND" | "UNKNOWN";
export interface ClassifiedError {
    category: ErrorCategory;
    signatureId: string;
    confidence: number;
    details: SignatureExtract;
}
export declare function classifyError(error: NormalizedError): ClassifiedError;
export type HttpStatusCategory = "SERVER_ERROR" | "CLIENT_ERROR" | "REDIRECTION" | "UNKNOWN";
export declare function isHttpError(message: string): boolean;
export declare function extractStatusCode(message: string): number | null;
export declare function classifyHttpStatus(status: number | null): HttpStatusCategory;
