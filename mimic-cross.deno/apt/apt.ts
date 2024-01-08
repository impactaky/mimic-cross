import $ from "daxex/mod.ts";
import { prepareChroot, runOnHost } from "../src/chroot.ts";
import { config } from "../config/config.ts";
import { deployAllCommands } from "./helper.ts";
import { logger } from "../src/log.ts";

export interface deployPackageOptions {
  force?: boolean;
}

const packageDir = $.path(import.meta.url).parent()?.join("packages");
if (!packageDir) throw new Error("Package directory path is undefined.");
const supportedPackagesPromise = (async () => {
  const supportedPackages = new Set<string>();
  for await (const file of packageDir.readDir()) {
    if (!file.isFile) continue;
    supportedPackages.add(file.name.replace(/\.ts$/, ""));
  }
  return supportedPackages;
})();

export async function aptGetOnHost(arg: string) {
  await prepareChroot;
  const args = $.split(arg);
  if (args[0] === "install" && Deno.env.get("HOSTNAME") === "buildkitsandbox") {
    await runOnHost(`apt-get update`);
    console.log(`${args.slice(1).join(" ")}`);
    await runOnHost(
      `apt-get install -y --no-install-recommends ${args.slice(1).join(" ")}`,
    ).env("DEBIAN_FRONTEND", "noninteractive");
    await runOnHost(`apt-get clean`).quiet();
    await $.path(`${config.hostRoot}/var/lib/apt/lists`).remove({
      recursive: true,
    });
    return;
  }
  await runOnHost(`apt-get ${arg}`);
  return;
}

export async function deployPackages(
  packages: string[],
  options?: deployPackageOptions,
) {
  const supportedPackages = await supportedPackagesPromise;
  logger.debug(`(deployPackages) ${packages} { force=${options?.force} }`);
  const filteredPackages = options?.force
    ? packages
    : packages.filter((p) => supportedPackages.has(p));
  logger.debug(`(deployPackages) filteredPackages = ${filteredPackages}`);
  await aptGetOnHost(
    `install -y --no-install-recommends ${filteredPackages.join(" ")}`,
  );
  for (const p of filteredPackages) {
    const modulePath = `${packageDir}/${p}.ts`;
    try {
      const module = await import(`${modulePath}`);
      if (module.postInstall && typeof module.postInstall === "function") {
        logger.debug(`(deployPackages) call ${modulePath} postInstall`);
        await module.postInstall();
      } else {
        logger.debug(`(deployPackages) call depolyAllCommands(${p})`);
        await deployAllCommands(p);
      }
    } catch (error) {
      if (options?.force) {
        await deployAllCommands(p);
      } else {
        logger.error(`(deployPackages) can't import ${modulePath}`);
        throw error;
      }
      continue;
    }
  }
}

export async function deployInstalledPackages() {
  const installedPackages = await $`dpkg -l`.apply((l) => {
    const e = $.split(l);
    if (e[0] !== "ii") return;
    return e[1];
  }).lines();
  await deployPackages(installedPackages);
}
