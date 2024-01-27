#!/mimic-cross/mimic-cross/bin/mimic-deno run -A --ext=ts
import { Command } from "cliffy/command/mod.ts";
import {
  aptGet,
  deployPackages,
  findCommandsFromPackage,
  getAllInstalledPackages,
} from "../apt/apt.ts";
import { logger } from "./log.ts";
import { runOnHost } from "./chroot.ts";
import { setup } from "./setup.ts";

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
    await deployPackages(packageName, { force: options.force });
  })
  .command("chroot [command...]", "Run command in host")
  .action(async function (_, ...command) {
    const combinedArgs: string[] = (command || []).concat(
      this.getLiteralArgs() || [],
    );
    await runOnHost(combinedArgs);
  })
  .command("apt-get [args...]", "mimic apt-get command")
  .option("-f, --force", "force deploy package")
  .action(async function (options, ...command) {
    const combinedArgs: string[] = (command || []).concat(
      this.getLiteralArgs() || [],
    );
    await aptGet(combinedArgs, { force: options.force });
  })
  .command("suggest [packageName...]", "Suggest supported package list.")
  .option("--show_commands", "show deploy commands")
  .option("-a, --all", "Target all installed packages")
  .action(async function (options, ...packageName) {
    if (options.all) packageName = await getAllInstalledPackages();
    for (const p of packageName) {
      const commands = await findCommandsFromPackage(p);
      if (commands.length === 0) continue;
      console.log(`${p},`);
      if (!options.showCommands) continue;
      for (const c of commands) {
        console.log(`//  ${c}`);
      }
    }
  })
  .command("setup", "Setup mimic-cross environment")
  .action(async function () {
    await setup();
  })
  .parse(Deno.args);
