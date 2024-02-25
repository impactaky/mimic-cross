import $ from "daxex/mod.ts";
import { PathRefLike } from "daxex/mod.ts";
export { keepOriginalBin, mimicDeploy, mimicize } from "../src/deploy.ts";
import { config } from "../config/config.ts";
import { PackageInfo } from "../apt/package_info.ts";
import { deployIfHostCommands } from "../src/deploy.ts";
import { logger } from "../src/log.ts";
import { runOnHost } from "../src/chroot.ts";


export async function fileHas(
  path: PathRefLike,
  sentence: string,
): Promise<boolean> {
  const filePath = $.path(path);
  if (!filePath.isFileSync()) return false;
  const content = await filePath.readText();
  return content.includes(sentence);
}

export async function deployCli(
  command: string,
  target: PathRefLike,
  commandArg?: string,
) {
  commandArg = commandArg || "";
  const pathRef = $.path(target);
  await pathRef.writeText(`#!/bin/sh
/usr/local/bin/mimicx ${command} ${commandArg} -- "$@"
`);
  await pathRef.chmod(0o755);
}

export async function deployPackageCommands(
  package_: string,
  packageInfo: PackageInfo,
) {
  logger.info(`(deployPackageCommands) ${package_}`);
  logger.debug(`(deployPackageCommands) blockList = ${packageInfo.blockList}`);
  const commands = await runOnHost(`dpkg -L ${package_}`).lines();
  await deployIfHostCommands(commands, new Set(packageInfo.blockList));
}

export async function deployCrossTool(
  packageName: string,
  packageInfo: PackageInfo,
) {
  const crossPackageName = `${packageName}-${
    config.arch.replace("_", "-")
  }-linux-gnu`;
  await deployPackageCommands(crossPackageName, packageInfo);
}
