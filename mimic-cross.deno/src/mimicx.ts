#!/usr/bin/env -S mimic-deno run -A --ext=ts
import { Command } from "cliffy/command/mod.ts";
import { deployAllCommands } from "../apt/helper.ts";
import { logger } from "./log.ts";

await new Command()
  .name("mimicx")
  .version("0.1.0")
  .description("mimic-cross CLI tool")
  .globalOption("-v, --verbose", "Enable verbose output.")
  .globalAction((options, _) => {
    if (options.verbose) {
      logger.mode = "verbose";
    }
  })
  .command("deploy-package <packageName:string>", "Deploy a package.")
  .action((_, packageName) => {
    deployAllCommands(packageName);
  })
  .parse(Deno.args);
