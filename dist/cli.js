#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const clix_1 = require("./core/clix");
(0, clix_1.installGlobalErrorHandlers)();
(0, clix_1.clix)()
    .command("deploy", "Simulate a deployment that hits a network dependency.")
    .action(() => {
    throw new Error("connect ECONNREFUSED 127.0.0.1:5432");
});
(0, clix_1.clix)()
    .command("inspect", "Simulate reading from an undefined object.")
    .action(() => {
    const user = undefined;
    const data = user.profile.name;
    console.log(data);
});
(0, clix_1.clix)()
    .command("parse", "Simulate a syntax parsing failure.")
    .action(() => {
    throw new SyntaxError("Unexpected token } in JSON at position 18");
});
(0, clix_1.clix)()
    .command("request", "Simulate an HTTP 500 failure from a remote service.")
    .action(() => {
    throw new Error("Request failed with status code 500");
});
(0, clix_1.clix)()
    .command("pyimport", "Simulate a Python missing-module error.")
    .action(() => {
    throw Object.assign(new Error("ModuleNotFoundError: No module named 'requests'"), {
        name: "PythonTraceback",
    });
});
(0, clix_1.clix)()
    .command("prismadb", "Simulate a Prisma database connection failure.")
    .action(() => {
    throw new Error("PrismaClientInitializationError: Can't reach database server at localhost:5432");
});
void (0, clix_1.clix)().run();
//# sourceMappingURL=cli.js.map