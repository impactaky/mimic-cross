import $ from "daxex/mod.ts";
import { PathRefLike } from "daxex/mod.ts";
export { mimicDeploy } from "../src/deploy.ts";
export { deployPackageCommands } from "../apt/apt.ts";

export async function deployCli(command: string, target: PathRefLike) {
  const pathRef = $.path(target);
  await pathRef.writeText(`#!/bin/sh
/mimic-cross.deno/src/mimicx.ts ${command} -- $@
`);
  await pathRef.chmod(0o755);
}
