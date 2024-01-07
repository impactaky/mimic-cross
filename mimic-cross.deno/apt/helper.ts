import $ from "daxex/mod.ts";
import { PathRef } from "dax/mod.ts";
import { mimicDeploy } from "../src/deploy.ts";
export { mimicDeploy };

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
  await $`dpkg -L ${package_}`
    .forEach(async (l) => {
      const path = $.path(l);
      if (!isInPATH(path)) return;
      const realPath = path.resolve();
      const ret = await $`[ -x ${realPath} ]`;
      if (ret.code !== 0) return;
      if (blockList?.has(realPath.toString())) return;
      await mimicDeploy(realPath);
    });
}
