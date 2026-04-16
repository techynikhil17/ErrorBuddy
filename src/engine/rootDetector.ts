export function extractRootObject(snippet: string, property: string): string | null {
  const escapedProperty = escapeForRegex(property);
  const memberPattern = new RegExp(
    String.raw`([A-Za-z_$][\w$]*)\s*\.\s*${escapedProperty}\b`,
  );
  const optionalChainPattern = new RegExp(
    String.raw`([A-Za-z_$][\w$]*)\s*\?\.\s*${escapedProperty}\b`,
  );

  const memberMatch = snippet.match(memberPattern) ?? snippet.match(optionalChainPattern);
  return memberMatch?.[1] ?? null;
}

function escapeForRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
