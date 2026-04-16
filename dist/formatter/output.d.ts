import { ClassifiedError } from "../engine/classify";
import { ExplainedError } from "../engine/explain";
import { NormalizedError } from "../engine/normalize";
import { SuggestionMessage } from "../engine/suggest";
export declare function isVerboseMode(errorType?: string): boolean;
export declare function formatErrorOutput(explained: ExplainedError, normalized: NormalizedError, classified: ClassifiedError, fixes: string[]): string;
export declare function formatSuggestionOutput(input: string, suggestion: SuggestionMessage): string;
