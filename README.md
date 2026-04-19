# errbuddy
Your terminal's error best friend

## Installation

```bash
npm install -g errbuddy
```

## Before/After

before

```text
Error: connect ECONNREFUSED 127.0.0.1:5432
    at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1555:16)
    at connect (node:net:1498:10)
    at Socket.connect (node:net:1390:5)
    at Object.<anonymous> (src/server.ts:42:13)
    at Module._compile (node:internal/modules/cjs/loader:1256:14)
    at Object.Module._extensions..js (node:internal/modules/cjs/loader:1310:10)
    at Module.load (node:internal/modules/cjs/loader:1119:32)
    at Function.Module._load (node:internal/modules/cjs/loader:960:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:81:12)
    at node:internal/main/run_main_module:23:47
```

after

```text
❌ Connection Refused
📍 src/server.ts:42
💡 Nothing is accepting connections on port 5432 right now.
🛠 Fix: Start the service listening on port 5432.
ℹ️  Run with --verbose for full details
```

## Usage

```bash
errbuddy run npm run dev
errbuddy run python manage.py runserver
errbuddy run go run .
errbuddy run cargo run
errbuddy run node server.js
```

## Supported runtimes

- Node.js
- TypeScript
- Python
- Go
- Rust
- Java / JVM
- Docker
- Prisma
- Next.js
- Rails
- PostgreSQL
- Generic HTTP errors
- Out-of-memory failures
- Disk full errors

## How it works

Errbuddy wraps your command and intercepts stderr in real time. It detects the runtime, matches the error against known signatures, and extracts useful context like ports, files, modules, and JSON positions. Then it turns that into a short human explanation plus concrete fixes. If the error is unknown, it still shows a structured panel instead of guessing.

## Verbose mode

Use `--verbose` or `-v` to show the raw error, signature ID, confidence score, and detected runtime.

```bash
errbuddy --verbose run npm run dev
```

## Contributing

Found a bad classification or want support for another runtime? Open an issue.

## License

MIT
