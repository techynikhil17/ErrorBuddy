#!/usr/bin/env node

import { clix, installGlobalErrorHandlers } from "./core/clix";
import { installShellHook } from "./core/initHook";

installGlobalErrorHandlers();

const app = clix();

app
  .command("init", "Install the errbuddy shell hook into your shell config.")
  .action(() => {
    installShellHook();
  });

app
  .command("_classify", { hidden: true })
  .description("Internal: classify stdin as an error block")
  .action(async () => {
    const chunks: Buffer[] = [];

    for await (const chunk of process.stdin) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    const raw = Buffer.concat(chunks).toString("utf8").trim();

    if (!raw) {
      return;
    }

    const { classifyRawBlock } = await import("./engine/blockClassifier");
    const { classifyError } = await import("./engine/classify");
    const { explainError } = await import("./engine/explain");
    const { buildFixSuggestions } = await import("./engine/suggest");
    const { formatErrorOutput } = await import("./formatter/output");

    const normalized = classifyRawBlock(raw);
    const classified = classifyError(normalized);

    if (classified.confidence <= 0.5) {
      return;
    }

    const explained = explainError(normalized, classified);
    const fixes = buildFixSuggestions(classified, normalized);
    const output = formatErrorOutput(explained, normalized, classified, fixes);
    process.stderr.write(output.endsWith("\n") ? output + "\n" : output + "\n\n");
  });

app
  .command("deploy", "Simulate a deployment that hits a network dependency.")
  .action(() => {
    throw new Error("connect ECONNREFUSED 127.0.0.1:5432");
  });

app
  .command("inspect", "Simulate reading from an undefined object.")
  .action(() => {
    const user = undefined as any;
    const data = user.profile.name;
    console.log(data);
  });

app
  .command("parse", "Simulate a syntax parsing failure.")
  .action(() => {
    throw new SyntaxError("Unexpected token } in JSON at position 18");
  });

app
  .command("request", "Simulate an HTTP 500 failure from a remote service.")
  .action(() => {
    throw new Error("Request failed with status code 500");
  });

app
  .command("pyimport", "Simulate a Python missing-module error.")
  .action(() => {
    throw Object.assign(new Error("ModuleNotFoundError: No module named 'requests'"), {
      name: "PythonTraceback",
    });
  });

app
  .command("prismadb", "Simulate a Prisma database connection failure.")
  .action(() => {
    throw new Error(
      "PrismaClientInitializationError: Can't reach database server at localhost:5432",
    );
  });

void app.run();
