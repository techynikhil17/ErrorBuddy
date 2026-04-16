/**
 * Entity extraction helpers.
 *
 * These utilities pull a concrete name (function, module, file, variable, …)
 * out of a raw error message line so the explanation engine can produce
 * precise, entity-aware messages instead of generic placeholders.
 */

/**
 * Extracts the first quoted value (single or double quotes) from a line.
 * Returns null when no quoted value is present.
 *
 * Examples:
 *   `Cannot find module 'lodash'`       → "lodash"
 *   `'myVar' is not defined`            → "myVar"
 *   `reading property "length" of null` → "length"
 */
export function extractEntity(line: string): string | null {
  const match = line.match(/['"]([^'"]+)['"]/);
  return match ? match[1] : null;
}

/**
 * Classifies the kind of entity referenced in an error line.
 *
 * Rules (evaluated in order, case-insensitive):
 *   "function"  → "function"
 *   "module"    → "module"
 *   "file"      → "file"
 *   "variable"  → "variable"
 *   fallback    → "resource"
 */
export function detectEntityType(line: string): string {
  const lower = line.toLowerCase();

  if (lower.includes("function")) return "function";
  if (lower.includes("module"))   return "module";
  if (lower.includes("file"))     return "file";
  if (lower.includes("variable")) return "variable";

  return "resource";
}
