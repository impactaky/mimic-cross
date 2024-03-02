import { Command } from "cliffy/command/mod.ts";
import $ from "daxex/mod.ts";

await new Command()
  .option("--check", "Don't format, just check")
  .option("--git", "Use git ls-files")
  .action(async (options, ..._) => {
    if (options.check) {
      await $`deno fmt --check`;
    } else {
      await $`deno fmt`;
    }
    await $`deno lint`;
    if (options.git) {
      await $`git ls-files | grep .sh$ | xargs shellcheck`;
      await $`git ls-files | grep .dockerfile$ | xargs hadolint`;
    } else {
      await $`find . -name "*.sh" -print0 | xargs -0 shellcheck`;
      await $`find . -name "*.dockerfile" -print0 | xargs -0 hadolint`;
    }
  })
  .parse(Deno.args);
