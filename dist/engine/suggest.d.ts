import { ClassifiedError } from "./classify";
import { NormalizedError } from "./normalize";
export interface SuggestionMessage {
    heading: string;
    suggestion?: string;
}
export declare function buildSuggestionText(suggestedCommand?: string): SuggestionMessage;
export declare function buildFixSuggestions(classified: ClassifiedError, error: NormalizedError): string[];
