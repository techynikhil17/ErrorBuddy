import { Command } from "commander";
import { classifyError } from "../engine/classify";
import { explainError } from "../engine/explain";
import { normalizeError } from "../engine/normalize";
import { buildFixSuggestions, buildSuggestionText } from "../engine/suggest";
import { formatErrorOutput, formatSuggestionOutput } from "../formatter/output";
import { runWrappedCommand } from "../runner";
import { buildInvalidCommandResult, resolveInputCommandName } from "./parser";

type CommandAction = (...args: unknown[]) => unknown | Promise<unknown>;
type CommandRegistrationOptions = {
  hidden?: boolean;
};

export class ClixApp {
  private readonly program: Command;
  private readonly commandNames = new Set<string>();

  constructor(name = "eb") {
    this.program = new Command();
    this.program
      .name(name)
      .description("Developer-friendly CLI commands with intelligent error handling.")
      .option("-v, --verbose", "show full diagnostic output")
      .enablePositionalOptions()
      .showHelpAfterError()
      .allowUnknownOption(false);

    this.program
      .command("run")
      .description("Run an external command through eb error handling.")
      .allowUnknownOption(true)
      .passThroughOptions()
      .argument("<command...>", "command to execute")
      .action(async (commandParts: string[]) => {
        try {
          await runWrappedCommand(commandParts);
        } catch (error) {
          renderClixError(error);
          process.exitCode = 1;
        }
      });

    this.commandNames.add("run");
  }

  command(name: string, descriptionOrOptions?: string | CommandRegistrationOptions): Command {
    this.commandNames.add(name);

    const options =
      descriptionOrOptions && typeof descriptionOrOptions === "object"
        ? descriptionOrOptions
        : undefined;
    const registered = options ? this.program.command(name, options) : this.program.command(name);

    if (typeof descriptionOrOptions === "string") {
      registered.description(descriptionOrOptions);
    }

    const originalAction = registered.action.bind(registered);

    registered.action = (handler: CommandAction) => {
      return originalAction(async (...args: unknown[]) => {
        try {
          await handler(...args);
        } catch (error) {
          this.renderError(error);
          process.exitCode = 1;
        }
      });
    };

    return registered;
  }

  async run(argv = process.argv): Promise<void> {
    const inputCommand = resolveInputCommandName(argv);

    if (inputCommand) {
      const invalidCommand = buildInvalidCommandResult(
        inputCommand,
        Array.from(this.commandNames),
      );

      if (invalidCommand) {
        console.error(
          formatSuggestionOutput(
            invalidCommand.enteredCommand,
            buildSuggestionText(invalidCommand.suggestedCommand),
          ),
        );
        process.exitCode = 1;
        return;
      }
    }

    try {
      await this.program.parseAsync(argv);
    } catch (error) {
      this.renderError(error);
      process.exitCode = 1;
    }
  }

  private renderError(error: unknown): void {
    renderClixError(error);
  }
}

let sharedInstance: ClixApp | undefined;

export function clix(): ClixApp {
  if (!sharedInstance) {
    sharedInstance = new ClixApp();
  }

  return sharedInstance;
}

export function renderClixError(error: unknown): void {
  const normalized = normalizeError(error);
  const classified = classifyError(normalized);
  const explained = explainError(normalized, classified);
  const fixes = buildFixSuggestions(classified, normalized);
  console.error(formatErrorOutput(explained, normalized, classified, fixes));
}

export function installGlobalErrorHandlers(): void {
  process.on("uncaughtException", (error) => {
    renderClixError(error);
    process.exitCode = 1;
  });

  process.on("unhandledRejection", (reason) => {
    renderClixError(reason);
    process.exitCode = 1;
  });
}
