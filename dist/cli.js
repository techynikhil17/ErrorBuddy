#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const clix_1 = require("./core/clix");
const initHook_1 = require("./core/initHook");
(0, clix_1.installGlobalErrorHandlers)();
const app = (0, clix_1.clix)();
app
    .command("init", "Install the errbuddy shell hook into your shell config.")
    .action(() => {
    (0, initHook_1.installShellHook)();
});
app
    .command("_classify", { hidden: true })
    .description("Internal: classify stdin as an error block")
    .action(async () => {
    const chunks = [];
    for await (const chunk of process.stdin) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const raw = Buffer.concat(chunks).toString("utf8").trim();
    if (!raw) {
        return;
    }
    const { classifyRawBlock } = await Promise.resolve().then(() => __importStar(require("./engine/blockClassifier")));
    const { classifyError } = await Promise.resolve().then(() => __importStar(require("./engine/classify")));
    const { explainError } = await Promise.resolve().then(() => __importStar(require("./engine/explain")));
    const { buildFixSuggestions } = await Promise.resolve().then(() => __importStar(require("./engine/suggest")));
    const { formatErrorOutput } = await Promise.resolve().then(() => __importStar(require("./formatter/output")));
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
    const user = undefined;
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
    throw new Error("PrismaClientInitializationError: Can't reach database server at localhost:5432");
});
void app.run();
//# sourceMappingURL=cli.js.map