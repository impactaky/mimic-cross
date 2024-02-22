import $ from "daxex/mod.ts";
import { PathRefLike } from "daxex/mod.ts";
import { prepareChroot, runOnHost } from "../src/chroot.ts";
import { config } from "../config/config.ts";
import { logger } from "../src/log.ts";
import { format } from "std/datetime/mod.ts";
import { deployIfHostCommands, findCommands } from "../src/deploy.ts";
import { PackageInfo } from "./package_info.ts";
import { deployCrossTool } from "./helper.ts";

import * as apt from "./packages/apt.ts";
import * as gcc from "./packages/gcc.ts";
import * as sudo from "./packages/sudo.ts";
import * as python from "./packages/python3.10-minimal.ts";

export interface deployPackageOptions {
  force?: boolean;
}

const packageDir = $.path(import.meta.url).parent()?.join("packages");
if (!packageDir) throw new Error("Package directory path is undefined.");
const supportedPackagesPromise = (async () => {
  // Create set from packages/supported.json
  const supportedPackages = await $.path(import.meta.url).parent()?.join(
    "packages",
    "supported.json",
  ).readJson<Record<string, PackageInfo>>();
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
      ).env({ ...Deno.env.toObject(), "DEBIAN_FRONTEND": "noninteractive" });
      return;
    } else if (args[0] === "clean") {
      await runOnHost([`apt-get`, ...args]).env(Deno.env.toObject());
      await $.path(`${config.hostRoot}/var/lib/apt/lists`).remove({
        recursive: true,
      });
      return;
    }
  }
  await runOnHost([`apt-get`, ...args]).env(Deno.env.toObject());
  return;
}

export async function deployPackageCommands(
  package_: string,
  packageInfo: PackageInfo,
) {
  logger.info(`(deployPackageCommands) ${package_}`);
  const commands = await runOnHost(`dpkg -L ${package_}`).lines();
  await deployIfHostCommands(commands, new Set(packageInfo.blockList));
}

export async function deployPackages(
  packages: string[],
  options?: deployPackageOptions,
) {
  const supportedPackages = await supportedPackagesPromise;
  logger.debug(`(deployPackages) ${packages} { force=${options?.force} }`);
  const filteredPackages: string[] = (() => {
    if (options?.force) return packages;
    const filteredPackages: string[] = [];
    for (const p of packages) {
      if (!(p in supportedPackages)) continue;
      if (supportedPackages[p].isCrossTool) {
        filteredPackages.push(
          `${p}-${config.arch.replace("_", "-")}-linux-gnu`,
        );
        continue;
      }
      filteredPackages.push(p);
    }
    return filteredPackages;
  })();
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
    switch (packageInfo.postInstall) {
      case "default":
      case undefined:
        logger.debug(`(deployPackages) call depolyAllCommands(${p})`);
        await deployPackageCommands(p, packageInfo);
        break;
      case "crossTool":
        logger.debug(`(deployPackages) call depolyCrossTool(${p})`);
        await deployCrossTool(p, packageInfo);
        break;
      case "skip":
        logger.debug(`(deployPackages) skip postInstall(${p})`);
        break;
      case "apt":
        logger.debug(`(deployPackages) apt.postInstall(${p})`);
        await apt.postInstall();
        break;
      case "gcc":
        logger.debug(`(deployPackages) gcc.postInstall(${p})`);
        await gcc.postInstall(p, packageInfo);
        break;
      case "sudo":
        logger.debug(`(deployPackages) sudo.postInstall(${p})`);
        await sudo.postInstall();
        break;
      case "python":
        logger.debug(`(deployPackages) python.postInstall(${p})`);
        await python.postInstall();
        break;
      default:
        logger.error(
          `(deployPackages) Unknown postInstall ${packageInfo.postInstall}`,
        );
        throw new Error(`Unknown postInstall ${packageInfo.postInstall}`);
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

async function mimicAptGetUpdate(args: string[]) {
  // Check apt-config
  await $`apt-config dump`.forEach((l) => {
    const sep = $.split(l);
    const assertAptConfig = (expect: string) => {
      if (sep[1] === expect) return;
      throw new Error(
        `Currently only default path ${expect}, given : ${sep[1]}`,
      );
    };
    switch (sep[0]) {
      case "Dir::Etc::sourcelist": {
        assertAptConfig('"sources.list";');
        return;
      }
      case "Dir::Etc::sourceparts": {
        assertAptConfig('"sources.list.d";');
        return;
      }
      case "Dir::Etc::trusted": {
        assertAptConfig('"trusted.gpg";');
        return;
      }
      case "Dir::Etc::trustedparts": {
        assertAptConfig('"trusted.gpg.d";');
        return;
      }
      default:
        return;
    }
  });
  // TODO detect sources.list modification
  // TODO check sources.list.d URL
  await Promise.all([
    $`/usr/bin/cp -a /etc/apt/trusted.gpg.d/. ${config.hostRoot}/etc/apt/trusted.gpg.d/`,
    $`/usr/bin/cp -a /etc/apt/sources.list.d/. ${config.hostRoot}/etc/apt/sources.list.d/`,
    $`/usr/bin/cp -a /usr/share/keyrings/. ${config.hostRoot}/usr/share/keyrings/`,
  ]);
  await aptGetOnHost(args);
}

export async function aptGet(
  arg: string | string[],
  options?: deployPackageOptions,
) {
  const ts = format(new Date(), "yyyy-MM-dd HH:mm:ss");
  const args = arg instanceof Array ? arg : $.split(arg);
  logger.info(`(aptGet) Run apt-get ${arg}`);
  await $.command([`${config.keepBin}/apt-get`, ...args]).env(
    Deno.env.toObject(),
  );
  if (Deno.env.get("MIMIC_CROSS_DISABLE") === "1") {
    return;
  }
  if (args[0] === "update") {
    await mimicAptGetUpdate(args);
  }
  logger.debug(`(aptGet) Start search installed packages from ${ts}`);
  const installedPackages = await getIntalledPackagesFromLog(ts);
  logger.debug(`(aptGet) installedPackages = ${installedPackages}`);
  if (installedPackages.length === 0) return;
  await deployPackages(installedPackages, options);
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
