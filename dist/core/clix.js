"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClixApp = void 0;
exports.clix = clix;
exports.renderClixError = renderClixError;
exports.installGlobalErrorHandlers = installGlobalErrorHandlers;
const commander_1 = require("commander");
const classify_1 = require("../engine/classify");
const explain_1 = require("../engine/explain");
const normalize_1 = require("../engine/normalize");
const suggest_1 = require("../engine/suggest");
const output_1 = require("../formatter/output");
const runner_1 = require("../runner");
const parser_1 = require("./parser");
class ClixApp {
    constructor(name = "clix") {
        this.commandNames = new Set();
        this.program = new commander_1.Command();
        this.program
            .name(name)
            .description("Developer-friendly CLI commands with intelligent error handling.")
            .option("-v, --verbose", "show full diagnostic output")
            .enablePositionalOptions()
            .showHelpAfterError()
            .allowUnknownOption(false);
        this.program
            .command("run")
            .description("Run an external command through clix error handling.")
            .allowUnknownOption(true)
            .passThroughOptions()
            .argument("<command...>", "command to execute")
            .action(async (commandParts) => {
            try {
                const rawCommand = (0, runner_1.buildRawCommand)(commandParts);
                await (0, runner_1.runWrappedCommand)(rawCommand);
            }
            catch (error) {
                renderClixError(error);
                process.exitCode = 1;
            }
        });
        this.commandNames.add("run");
    }
    command(name, description) {
        this.commandNames.add(name);
        const registered = this.program.command(name);
        if (description) {
            registered.description(description);
        }
        const originalAction = registered.action.bind(registered);
        registered.action = (handler) => {
            return originalAction(async (...args) => {
                try {
                    await handler(...args);
                }
                catch (error) {
                    this.renderError(error);
                    process.exitCode = 1;
                }
            });
        };
        return registered;
    }
    async run(argv = process.argv) {
        const inputCommand = (0, parser_1.resolveInputCommandName)(argv);
        if (inputCommand) {
            const invalidCommand = (0, parser_1.buildInvalidCommandResult)(inputCommand, Array.from(this.commandNames));
            if (invalidCommand) {
                console.error((0, output_1.formatSuggestionOutput)(invalidCommand.enteredCommand, (0, suggest_1.buildSuggestionText)(invalidCommand.suggestedCommand)));
                process.exitCode = 1;
                return;
            }
        }
        try {
            await this.program.parseAsync(argv);
        }
        catch (error) {
            this.renderError(error);
            process.exitCode = 1;
        }
    }
    renderError(error) {
        renderClixError(error);
    }
}
exports.ClixApp = ClixApp;
let sharedInstance;
function clix() {
    if (!sharedInstance) {
        sharedInstance = new ClixApp();
    }
    return sharedInstance;
}
function renderClixError(error) {
    const normalized = (0, normalize_1.normalizeError)(error);
    const classified = (0, classify_1.classifyError)(normalized);
    const explained = (0, explain_1.explainError)(normalized, classified);
    const fixes = (0, suggest_1.buildFixSuggestions)(classified, normalized);
    console.error((0, output_1.formatErrorOutput)(explained, normalized, classified, fixes));
}
function installGlobalErrorHandlers() {
    process.on("uncaughtException", (error) => {
        renderClixError(error);
        process.exitCode = 1;
    });
    process.on("unhandledRejection", (reason) => {
        renderClixError(reason);
        process.exitCode = 1;
    });
}
//# sourceMappingURL=clix.js.map