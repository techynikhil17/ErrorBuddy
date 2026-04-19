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
eb run npm run dev --verbose
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
It watches stderr for known error block patterns across 11 runtimes using a real-time debounced buffer.
When a match is found, it runs the raw text through a classify → explain → suggest pipeline and replaces the noise with a clean panel.
Unrecognised output passes through as-is — errbuddy stays silent unless it has something useful to say.

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

## Contributing

Open an issue with the raw stderr text whenever errbuddy misses or misclassifies something. The tool is still early, and every good report turns into a better signature in the next release.

## License

MIT © errbuddy contributors
