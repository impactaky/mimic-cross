import $ from "daxex/mod.ts";
import { PathRefLike } from "daxex/mod.ts";
export { mimicDeploy } from "../src/deploy.ts";
import { deployPackageCommands } from "../apt/apt.ts";
export { deployPackageCommands } from "../apt/apt.ts";
import { config } from "../config/config.ts";

export async function deployCli(command: string, target: PathRefLike) {
  const pathRef = $.path(target);
  await pathRef.writeText(`#!/bin/sh
/usr/local/bin/mimicx ${command} -- $@
`);
  await pathRef.chmod(0o755);
}

export async function deployCrossTool(
  packageName: string,
  blockList?: Set<string>,
) {
  const crossPackageName = `${packageName}-${config.arch}-linux-gnu`;
  await deployPackageCommands(crossPackageName, blockList);
}
