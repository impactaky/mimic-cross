import $ from "daxex/mod.ts";
import { PathRefLike } from "daxex/mod.ts";
import { prepareChroot, runOnHost } from "../src/chroot.ts";
import { config } from "../config/config.ts";
import { logger } from "../src/log.ts";
import { format } from "std/datetime/mod.ts";
import { deployIfHostCommands, findCommands } from "../src/deploy.ts";

export interface deployPackageOptions {
  force?: boolean;
}

interface packageInfo {
  useCustomFunction?: boolean;
  isCrossTool?: boolean;
  blockList?: string[];
}

const packageDir = $.path(import.meta.url).parent()?.join("packages");
if (!packageDir) throw new Error("Package directory path is undefined.");
const supportedPackagesPromise = (async () => {
  // Create set from packages/supported.json
  const supportedPackages = await $.path(import.meta.url).parent()?.join(
    "packages",
    "supported.json",
  ).readJson<Record<string, packageInfo>>();
  if (supportedPackages === undefined) {
    throw new Error("Can't read supported.json");
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

export async function deployCrossTool(
  packageName: string,
  blockList?: Set<string>,
) {
  const crossPackageName = `${packageName}-${config.arch}-linux-gnu`;
  await deployPackageCommands(crossPackageName, blockList);
}

export async function deployPackages(
  packages: string[],
  options?: deployPackageOptions,
) {
  const supportedPackages = await supportedPackagesPromise;
  logger.debug(`(deployPackages) ${packages} { force=${options?.force} }`);
  const filteredPackages = options?.force
    ? packages
    : packages.filter((p) => p in supportedPackages);
  logger.debug(`(deployPackages) filteredPackages = ${filteredPackages}`);
  await aptGetOnHost(
    `install -y --no-install-recommends ${filteredPackages.join(" ")}`,
  );
  for (const p of filteredPackages) {
    const packageInfo = supportedPackages[p];
    if (packageInfo === undefined) {
      logger.error(
        `(deployPackages) Unsuported package ${p} exists in filterdPacakges.`,
      );
      throw new Error(`Package ${p} is not supported.`);
    }
    if (packageInfo.useCustomFunction) {
      const modulePath = `${packageDir}/${p}.ts`;
      const module = await import(`${modulePath}`);
      if (module.postInstall && typeof module.postInstall === "function") {
        logger.debug(`(deployPackages) call ${modulePath} postInstall`);
        await module.postInstall();
        continue;
      }
    }
    if (packageInfo.isCrossTool) {
      logger.debug(`(deployPackages) call depolyCrossTool(${p})`);
      continue;
    }
    logger.debug(`(deployPackages) call depolyAllCommands(${p})`);
    await deployPackageCommands(p, new Set(packageInfo.blockList));
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

export async function findCommandsFromPackage(
  package_: string,
) {
  const paths = await $`dpkg -L ${package_}`.lines();
  return await findCommands(paths);
}

export async function getAllInstalledPackages() {
  const arch = (await $`dpkg --print-architecture`.text()).trimEnd();
  return await $`dpkg -l`.apply((l) => {
    if (!l.startsWith("ii")) return;
    let name = $.split(l)[1];
    if (name.endsWith(`:${arch}`)) {
      name = name.slice(0, -arch.length - 1);
    }
    return name;
  }).lines();
}
