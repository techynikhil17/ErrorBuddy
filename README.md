<div align="center">
<img src="assets/banner.png" alt="errbuddy — your terminal's error best friend" width="100%">
<h1>errbuddy</h1>

<p>Your terminal's error best friend.<br/>
Stop reading stack traces. Start reading answers.</p>

<p>
  <a href="https://www.npmjs.com/package/errbuddy">
    <img src="https://img.shields.io/npm/v/errbuddy?color=crimson&label=npm&style=flat-square" alt="npm version">
  </a>
  <a href="https://www.npmjs.com/package/errbuddy">
    <img src="https://img.shields.io/npm/dm/errbuddy?style=flat-square&color=orange" alt="downloads">
  </a>
  <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="license">
  <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen?style=flat-square" alt="node">
</p>

</div>

<table>
<tr>
<th>without errbuddy</th>
<th>with errbuddy</th>
</tr>
<tr>
<td>

```text
Error: connect ECONNREFUSED 127.0.0.1:5432
    at TCPConnectWrap.afterConnect [as oncomplete] (node:net:494:16) {
  errno: -61,
  code: 'ECONNREFUSED',
  syscall: 'connect',
  address: '127.0.0.1',
  port: 5432
}
    at Object.<anonymous> (/Users/dev/project/src/db.ts:12:3)
    at Module._compile (node:internal/modules/cjs/loader:1364:14)
    at Object..js (node:internal/modules/cjs/loader:1422:10)
    at Module.load (node:internal/modules/cjs/loader:1203:32)
    at Function._load (node:internal/modules/cjs/loader:1019:12)
```

</td>
<td>

```text
❌ Connection Refused

📍 src/db.ts:12

💡 Nothing is accepting connections on port 5432 right now.

🛠 Fix: Start the service listening on port 5432.
   Confirm the connection string matches the running service.

ℹ️  Run with eb --verbose for full details
```

</td>
</tr>
</table>

## Installation

```bash
npm install -g errbuddy
```

**Option A — Automatic (recommended)**

```bash
eb init
```

Installs a shell hook — every command you run gets errbuddy interception automatically. No prefix needed ever again.

**Option B — Explicit**

```bash
eb run <your command>
```

No setup required. Prefix any command to run it through errbuddy.

## Usage

```bash
# after eb init — no changes to how you work
npm run dev
python manage.py runserver
go run .
cargo run

# explicit mode — works anywhere, no setup
eb run npm run dev
eb run python manage.py runserver
eb run go run .
eb run cargo run

# full diagnostic output
eb run -v npm run dev
```

## What errbuddy understands

| Runtime | What it catches |
|---|---|
| Node.js / TypeScript | TypeError, ECONNREFUSED, module not found, unhandled rejections, heap OOM |
| Python | Tracebacks, ModuleNotFoundError, import errors |
| Go | Runtime panics, goroutine dumps, build errors |
| Rust | Compiler errors (E-codes), thread panics |
| Java / JVM | Uncaught exceptions, stack traces |
| Docker | Daemon errors, missing images |
| Prisma | P-codes, init failures, constraint violations |
| Next.js | Compilation failures, unresolved modules |
| Rails | ActiveRecord errors, routing errors |
| PostgreSQL | Auth failures, role errors, connection refused |
| Generic | HTTP 4xx/5xx, disk full (ENOSPC), port conflicts |

## How it works

errbuddy spawns your command as a child process and pipes stdout through untouched in real time.
It watches stderr with a **two-tier hybrid detector**:

| Tier | Regex | Output |
|---|---|---|
| **Known** | Anchored patterns for 11 runtimes | Full panel — title, why, fix suggestions |
| **Heuristic** | Broad keyword net (`error`, `failed`, `exception`, `internal server error`, …) | Minimal panel — reformatted, no fake explanation |
| **Passthrough** | Everything else | Written to stderr as-is, untouched |

When a known error is detected, it runs the raw text through a classify → explain → suggest pipeline and replaces the noise with a clean panel.
When an unknown error is detected, it shows a minimal panel with no invented explanation.
Unrecognised output passes through untouched — errbuddy stays silent unless it has something useful to say.

Duplicate errors within a 10-second window are suppressed and counted, so long-running servers don't flood the terminal with the same panel.

## Verbose mode

Verbose mode keeps the same panel, then adds the signature, confidence, runtime, and raw error details underneath.

```text
══════════════════════
❌ Connection Refused
══════════════════════

📍 Location
src/db.ts:12

──────────────
💡 What went wrong
The target service actively refused the connection attempt.

👉 Why
Nothing is accepting connections on port 5432 right now.

──────────────
🛠 Fix
1. Start the service listening on port 5432.
2. Confirm the connection string matches the service that should be running.

──────────────
🧭 Signature
connection-refused (97% confidence)

──────────────
🌐 Runtime
Node.js

──────────────
🔎 Raw Error
connect ECONNREFUSED 127.0.0.1:5432
```

Activate with `eb run -v <command>` or set `CLIX_VERBOSE=1`.

## Unknown error detection

For errors that don't match any known signature (Django `OperationalError`, Express middleware failures, custom exceptions, etc.), errbuddy shows a minimal panel instead of letting raw lines scroll by:

```text
⚠️  Internal Server Error: /api/users/
OperationalError: no such table: users
ℹ️  Unrecognised error — showing raw output
```

No invented `💡 Why` or `🛠 Fix` — those only appear when errbuddy actually understands the error.
The server keeps running. Exit codes are not affected for non-fatal errors.

If the same unknown error repeats within 10 seconds, dedup kicks in:

```text
⚠️  Same error repeated ×3 — suppressing duplicates
```

## Changelog

### v1.1.0
- **Hybrid detection** — a broad heuristic net now catches unknown errors (e.g. `Internal Server Error`, `OperationalError`) and renders a minimal panel instead of raw output
- **Adaptive flush** — heuristic error blocks flush after a single line + blank, so short 2-line framework errors are caught immediately
- **Dedup for unknown errors** — same heuristic panel suppressed and counted within a 10-second window

### v1.0.1
- **Windows fix** — `spawn` now uses `shell: true` on Windows so `npm`, `yarn`, and `pnpm` resolve correctly (`ENOENT` on `.cmd` scripts is gone)
- **`-v` flag fix** — verbose flag is now scoped to the `run` subcommand; previously `-v` was passed as the command to spawn, causing `ENOENT`
- **Server log streaming** — passthrough stderr lines (Django, Next.js, Rails access logs) are no longer gated on stdout activity; they stream immediately

## Contributing

Open an issue with the raw stderr text whenever errbuddy misses or misclassifies something. The tool is still early, and every good report turns into a better signature in the next release.

## License

MIT © errbuddy contributors
