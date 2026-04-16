#!/usr/bin/env node

import { clix, installGlobalErrorHandlers } from "./core/clix";

installGlobalErrorHandlers();

clix()
  .command("deploy", "Simulate a deployment that hits a network dependency.")
  .action(() => {
    throw new Error("connect ECONNREFUSED 127.0.0.1:5432");
  });

clix()
  .command("inspect", "Simulate reading from an undefined object.")
  .action(() => {
    const user = undefined as any;
    const data = user.profile.name;
    console.log(data);
  });

clix()
  .command("parse", "Simulate a syntax parsing failure.")
  .action(() => {
    throw new SyntaxError("Unexpected token } in JSON at position 18");
  });

clix()
  .command("request", "Simulate an HTTP 500 failure from a remote service.")
  .action(() => {
    throw new Error("Request failed with status code 500");
  });

void clix().run();
