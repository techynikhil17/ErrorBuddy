import fs from "fs";
import os from "os";
import path from "path";

const HOOK_MARKER = "# errbuddy hook";

const POSIX_HOOK_BLOCK = `# errbuddy hook — added by eb init
__eb_last_stderr=""
__eb_preexec() { __eb_last_stderr=""; }
__eb_precmd() {
  local exit_code=$?
  if [ $exit_code -ne 0 ] && [ -n "$__eb_last_stderr" ]; then
    echo "$__eb_last_stderr" | eb _classify
  fi
}
preexec_functions+=(__eb_preexec)
precmd_functions+=(__eb_precmd)
exec 2> >(tee >(cat >&2) | while IFS= read -r line; do
  __eb_last_stderr+="$line"$'\\n'
done)
`;

const FISH_HOOK_BLOCK = `# errbuddy hook — added by eb init
function __eb_on_error --on-event fish_postexec
  if test $status -ne 0
    echo $__eb_last_stderr | eb _classify
  end
end
`;

type SupportedShell = "zsh" | "bash" | "fish";

interface HookTarget {
  shell: SupportedShell;
  file: string;
  block: string;
}

export function installShellHook(): void {
  const target = resolveHookTarget(process.env.SHELL);

  if (!target) {
    printManualInstructions();
    return;
  }

  try {
    ensureHookInstalled(target);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown write failure.";
    console.error(`✗ Could not install errbuddy hook in ${target.file}`);
    console.error(message);
    console.error("");
    console.error("Add this block manually:");
    console.error("");
    console.error(target.block.trimEnd());
    process.exitCode = 1;
  }
}

function resolveHookTarget(shellEnv?: string): HookTarget | undefined {
  const home = os.homedir();
  const shell = (shellEnv ?? "").toLowerCase();

  if (shell.includes("zsh")) {
    return {
      shell: "zsh",
      file: path.join(home, ".zshrc"),
      block: POSIX_HOOK_BLOCK,
    };
  }

  if (shell.includes("bash")) {
    return {
      shell: "bash",
      file: path.join(home, ".bashrc"),
      block: POSIX_HOOK_BLOCK,
    };
  }

  if (shell.includes("fish")) {
    return {
      shell: "fish",
      file: path.join(home, ".config", "fish", "config.fish"),
      block: FISH_HOOK_BLOCK,
    };
  }

  return undefined;
}

function ensureHookInstalled(target: HookTarget): void {
  const existingContent = fs.existsSync(target.file)
    ? fs.readFileSync(target.file, "utf8")
    : "";

  if (existingContent.includes(HOOK_MARKER)) {
    console.log(`✓ errbuddy hook already installed in ${target.file}`);
    return;
  }

  ensureWritableTarget(target.file);

  const prefix = existingContent.length > 0 && !existingContent.endsWith("\n") ? "\n\n" : "";
  const suffix = target.block.endsWith("\n") ? target.block : `${target.block}\n`;

  fs.appendFileSync(target.file, `${prefix}${suffix}`, "utf8");

  console.log(`✓ errbuddy hook installed in ${target.file}`);
  console.log(`↻ Restart your terminal or run: source ${target.file}`);
}

function ensureWritableTarget(filePath: string): void {
  const directory = path.dirname(filePath);
  fs.mkdirSync(directory, { recursive: true });

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "", { encoding: "utf8", flag: "a" });
  }

  fs.accessSync(filePath, fs.constants.W_OK);
}

function printManualInstructions(): void {
  console.log("Could not detect a supported shell from SHELL.");
  console.log("Add one of the following hook blocks manually, then restart your terminal.");
  console.log("");
  console.log("bash / zsh:");
  console.log(POSIX_HOOK_BLOCK.trimEnd());
  console.log("");
  console.log("fish:");
  console.log(FISH_HOOK_BLOCK.trimEnd());
}
