#!/usr/bin/env -S mimic-deno run -A --ext=ts
import { Command } from "cliffy/command/mod.ts";
import { deployPackages } from "../apt/apt.ts";
import { logger } from "./log.ts";
import { runOnHost } from "./chroot.ts";

// import $ from "daxex/mod.ts";
// $.setPrintCommand(true);

await new Command()
  .name("mimicx")
  .version("0.1.0")
  .description("mimic-cross CLI tool")
  .globalOption("-v, --verbose", "Enable verbose output.")
  .globalOption("--debug", "Enable debug output.")
  .globalAction((options, _) => {
    if (options.debug) {
      logger.mode = "debug";
    } else if (options.verbose) {
      logger.mode = "verbose";
    }
  })
  .command("deploy-packages <packageName...:string>", "Deploy packages.")
  .option("-f, --force", "force deploy package")
  .action(async (options, ...packageName) => {
    console.log(packageName);
    await deployPackages(packageName, { force: options.force });
  })
  .command("chroot <command...:string>", "Run command in host")
  .action(async (_, ...command) => {
    await runOnHost(command);
  })
  .parse(Deno.args);
