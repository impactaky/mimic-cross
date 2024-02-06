import $ from "daxex/mod.ts";
import { PathRefLike } from "daxex/mod.ts";
export { keepOriginalBin, mimicDeploy, mimicize } from "../src/deploy.ts";
import { deployPackageCommands } from "../apt/apt.ts";
export { deployPackageCommands } from "../apt/apt.ts";
import { config } from "../config/config.ts";

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

export async function deployCrossTool(
  packageName: string,
  blockList?: Set<string>,
) {
  const crossPackageName = `${packageName}-${config.arch}-linux-gnu`;
  await deployPackageCommands(crossPackageName, blockList);
}
