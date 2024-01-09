import $ from "daxex/mod.ts";
import { PathRef } from "dax/mod.ts";
import { mimicDeploy } from "../src/deploy.ts";
export { mimicDeploy };
import { getElfArch } from "../src/util.ts";
import { logger } from "../src/log.ts";
import { runOnHost } from "../src/chroot.ts";
import { config } from "config/config.ts";

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
  await runOnHost(`dpkg -L ${package_}`)
    .forEach(async (l) => {
      const path = $.path(l);
      const hostPath = $.path(`${config.hostRoot}/${l}`);
      if (!isInPATH(path)) return;
      if (!hostPath.isFileSync() || hostPath.isSymlinkSync()) return;
      if (blockList && blockList.has(path.toString())) return;
      // path is executable
      const ret = await $`[ -x ${hostPath} ]`;
      if (ret.code !== 0) return;
      const elfArch = await getElfArch(hostPath);
      if (!elfArch) return;
      await mimicDeploy(path);
    });
}
