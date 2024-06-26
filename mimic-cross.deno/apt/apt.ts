import $ from "daxex/mod.ts";
import { PathRefLike } from "daxex/mod.ts";
import { runOnHost } from "../src/chroot.ts";
import { config } from "../config/config.ts";
import { logger } from "../src/log.ts";
import { format } from "std/datetime/mod.ts";
import { findCommands } from "../src/deploy.ts";
import { callPostInstall, getSupportedPackagesFrom } from "./package.ts";

export async function aptGetOnHost(arg: string | string[]) {
  logger.info(`(aptGetOnHost) Run apt-get ${arg}`);
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

export async function deployPackages(packages: string[]) {
  logger.debug(`(deployPackages) ${packages}`);
  const filteredPackages = await getSupportedPackagesFrom(packages);
  logger.debug(`(deployPackages) filteredPackages = ${filteredPackages}`);
  await aptGetOnHost(
    `install -y --no-install-recommends ${filteredPackages.join(" ")}`,
  );
  await callPostInstall(filteredPackages);
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

export async function aptGet(arg: string | string[]) {
  const ts = format(new Date(), "yyyy-MM-dd HH:mm:ss");
  const args = arg instanceof Array ? arg : $.split(arg);
  logger.info(`(aptGet) Run apt-get ${arg}`);
  await $.command([`${config.keep}/usr/bin/apt-get`, ...args]).env(
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
  await deployPackages(installedPackages);
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
