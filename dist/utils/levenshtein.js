"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findClosestCommand = findClosestCommand;
const levenshtein = require("fast-levenshtein");
function findClosestCommand(input, commands, maxDistance = 3) {
    let bestMatch;
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
//# sourceMappingURL=levenshtein.js.map