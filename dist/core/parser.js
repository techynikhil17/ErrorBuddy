"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveInputCommandName = resolveInputCommandName;
exports.buildInvalidCommandResult = buildInvalidCommandResult;
const levenshtein_1 = require("../utils/levenshtein");
function resolveInputCommandName(argv) {
    const args = argv.slice(2);
    for (const arg of args) {
        if (!arg.startsWith("-")) {
            return arg;
        }
    }
    return undefined;
}
function buildInvalidCommandResult(enteredCommand, validCommands) {
    if (!enteredCommand || validCommands.includes(enteredCommand)) {
        return undefined;
    }
    return {
        enteredCommand,
        suggestedCommand: (0, levenshtein_1.findClosestCommand)(enteredCommand, validCommands),
    };
}
//# sourceMappingURL=parser.js.map