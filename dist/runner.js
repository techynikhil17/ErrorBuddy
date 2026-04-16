"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runWrappedCommand = runWrappedCommand;
exports.buildRawCommand = buildRawCommand;
const child_process_1 = require("child_process");
async function runWrappedCommand(rawCommand) {
    if (!rawCommand.trim()) {
        throw new Error("No command was provided to run.");
    }
    console.log(`⚙️ Executing: ${rawCommand}`);
    console.log(`📂 Working Dir: ${process.cwd()}`);
    await new Promise((resolve, reject) => {
        const child = (0, child_process_1.spawn)(rawCommand, {
            cwd: process.cwd(),
            env: process.env,
            shell: true,
            stdio: ["inherit", "pipe", "pipe"],
        });
        let stdout = "";
        let stderr = "";
        child.stdout.on("data", (chunk) => {
            const text = chunk.toString();
            stdout += text;
            process.stdout.write(text);
        });
        child.stderr.on("data", (chunk) => {
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
function buildRawCommand(commandParts) {
    return commandParts.map(quoteForShell).join(" ");
}
function quoteForShell(value) {
    if (!value) {
        return '""';
    }
    if (/^[A-Za-z0-9_./:=+-]+$/.test(value)) {
        return value;
    }
    return `"${value.replace(/(["\\])/g, "\\$1")}"`;
}
//# sourceMappingURL=runner.js.map