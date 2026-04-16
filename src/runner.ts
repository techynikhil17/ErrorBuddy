import { spawn } from "child_process";

export async function runWrappedCommand(rawCommand: string): Promise<void> {
  if (!rawCommand.trim()) {
    throw new Error("No command was provided to run.");
  }

  console.log(`⚙️ Executing: ${rawCommand}`);
  console.log(`📂 Working Dir: ${process.cwd()}`);

  await new Promise<void>((resolve, reject) => {
    const child = spawn(rawCommand, {
      cwd: process.cwd(),
      env: process.env,
      shell: true,
      stdio: ["inherit", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer | string) => {
      const text = chunk.toString();
      stdout += text;
      process.stdout.write(text);
    });

    child.stderr.on("data", (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (code === 0) {
        if (stderr.trim()) {
          process.stderr.write(stderr);
        }

        resolve();
        return;
      }

      const errorMessage = stderr.trim() || stdout.trim() || `Wrapped command exited with code ${code}.`;
      reject({
        name: "WrappedCommandError",
        message: errorMessage,
        stack: errorMessage,
      });
    });
  });
}

export function buildRawCommand(commandParts: string[]): string {
  return commandParts.map(quoteForShell).join(" ");
}

function quoteForShell(value: string): string {
  if (!value) {
    return '""';
  }

  if (/^[A-Za-z0-9_./:=+-]+$/.test(value)) {
    return value;
  }

  return `"${value.replace(/(["\\])/g, "\\$1")}"`;
}
