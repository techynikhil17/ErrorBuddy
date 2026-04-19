# Security

`errbuddy` executes commands chosen by the user and inspects their stderr output in real time.

## Security model

- `errbuddy run <command> [args...]` now launches the target process with `child_process.spawn(..., { shell: false })`, so shell metacharacters such as `;`, `&&`, backticks, and `$()` are passed as literal arguments instead of being interpreted by a shell.
- The child process inherits the current environment by default. This is intentional: the wrapped command is the command the user explicitly chose to run, and many developer tools rely on inherited environment variables such as `PATH`, `HOME`, `DATABASE_URL`, and framework-specific secrets.
- Because the child process is user-selected code, it can read inherited environment variables. If you need a scrubbed environment, launch `errbuddy` from a restricted shell or prefix your command with an environment scrubber (`env -i` on Unix-like systems, or a constrained PowerShell/CMD environment on Windows).
- Source snippets are only read from regular files inside the current working directory. Stack traces pointing outside the workspace are ignored.
- `errbuddy` sanitizes non-display terminal control sequences from child stderr before rendering or passing them through, which blocks cursor movement, screen clearing, and OSC clipboard injection.

## Reporting

If you find a security issue, please open a private report with a minimal reproduction and affected version details.
