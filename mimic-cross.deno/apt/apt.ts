import $ from "daxex/mod.ts";
import { PathRefLike } from "daxex/mod.ts";
import { prepareChroot, runOnHost } from "../src/chroot.ts";
import { config } from "../config/config.ts";
import { logger } from "../src/log.ts";
import { format } from "std/datetime/mod.ts";
import { deployIfHostCommands } from "../src/deploy.ts";

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

export async function aptGetOnHost(arg: string | string[]) {
  logger.info(`(aptGetOnHost) Run apt-get ${arg}`);
  await prepareChroot;
  const args = arg instanceof Array ? arg : $.split(arg);
  if (Deno.env.get("HOSTNAME") === "buildkitsandbox") {
    if (args[0] === "install") {
      await runOnHost(
        [
          "apt-get",
          "install",
          "-y",
          "--no-install-recommends",
          ...args.slice(1),
        ],
      ).env("DEBIAN_FRONTEND", "noninteractive");
      return;
    } else if (args[0] === "clean") {
      await runOnHost([`apt-get`, ...args]);
      await $.path(`${config.hostRoot}/var/lib/apt/lists`).remove({
        recursive: true,
      });
      return;
    }
  }
  await runOnHost([`apt-get`, ...args]);
  return;
}

export async function deployPackageCommands(
  package_: string,
  blockList?: Set<string>,
) {
  logger.info(`(deployPackageCommands) ${package_}`);
  const commands = await runOnHost(`dpkg -L ${package_}`).lines();
  await deployIfHostCommands(commands, blockList);
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
    let module;
    try {
      module = await import(`${modulePath}`);
    } catch (error) {
      if (options?.force) {
        await deployPackageCommands(p);
        continue;
      } else {
        logger.error(`(deployPackages) can't import ${modulePath}`);
        throw error;
      }
    }
    if (module.postInstall && typeof module.postInstall === "function") {
      logger.debug(`(deployPackages) call ${modulePath} postInstall`);
      await module.postInstall();
    } else {
      logger.debug(`(deployPackages) call depolyAllCommands(${p})`);
      await deployPackageCommands(p);
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

export function getIntalledPackagesFromLog(
  ts: string,
  logFile: PathRefLike = "/var/log/dpkg.log",
) {
  return $.cat(logFile).apply((l) => {
    if (l < ts) return;
    const m = l.match(/status installed (.*?):/);
    return m?.[1];
  }).lines();
}

export async function aptGet(
  arg: string | string[],
  options?: deployPackageOptions,
) {
  const ts = format(new Date(), "yyyy-MM-dd HH:mm:ss");
  const args = arg instanceof Array ? arg : $.split(arg);
  logger.info(`(aptGet) Run apt-get ${arg}`);
  await $.command([`${config.keepBin}/apt-get`, ...args]);
  if (args[0] === "update") {
    await aptGetOnHost(args);
  }
  logger.debug(`(aptGet) Start search installed packages from ${ts}`);
  const installedPackages = await getIntalledPackagesFromLog(ts);
  logger.debug(`(aptGet) installedPackages = ${installedPackages}`);
  if (installedPackages.length === 0) return;
  return deployPackages(installedPackages, options);
}
