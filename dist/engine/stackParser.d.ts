export interface StackLocation {
    file: string;
    line: number;
    column?: number;
}
export declare function parseStackTrace(stack?: string): StackLocation | undefined;
