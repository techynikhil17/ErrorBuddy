const levenshtein: { get(left: string, right: string): number } = require("fast-levenshtein");

export function findClosestCommand(
  input: string,
  commands: string[],
  maxDistance = 3,
): string | undefined {
  let bestMatch: string | undefined;
  let smallestDistance = Number.POSITIVE_INFINITY;

  for (const command of commands) {
    const distance = levenshtein.get(input, command);

    if (distance < smallestDistance) {
      smallestDistance = distance;
      bestMatch = command;
    }
  }

  return smallestDistance <= maxDistance ? bestMatch : undefined;
}
