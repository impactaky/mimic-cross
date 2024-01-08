import $ from "daxex/mod.ts";
import { PathRef } from "dax/mod.ts";
import { mimicDeploy } from "../src/deploy.ts";
export { mimicDeploy };
import { getElfArch } from "../src/util.ts";
import { logger } from "../src/log.ts";

function isInPATH(filePath: string | PathRef) {
  filePath = $.path(filePath);
  const paths = Deno.env.get("PATH")?.split(":");
  if (!paths) return false;
  for (const p of paths) {
    if (filePath.dirname() === p) return true;
  }
  return false;
}

export async function deployAllCommands(
  package_: string,
  blockList?: Set<string>,
) {
  logger.info(`(deployAllommands) ${package_}`);
  await $`dpkg -L ${package_}`
    .forEach(async (l) => {
      const path = $.path(l);
      if (!isInPATH(path)) return;
      if (!path.isFileSync() || path.isSymlinkSync()) return;
      if (blockList && blockList.has(path.toString())) return;
      // path is executable
      const ret = await $`[ -x ${path} ]`;
      if (ret.code !== 0) return;
      const elfArch = await getElfArch(path);
      if (!elfArch) return;
      await mimicDeploy(path);
    });
}
