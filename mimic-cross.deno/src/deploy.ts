import $ from "daxex/mod.ts";
import { PathRefLike } from "daxex/mod.ts";
import { config } from "config/config.ts";
import { logger } from "./log.ts";
import { isElfExecutable } from "./util.ts";

export async function keepOriginalBin(path: PathRefLike) {
  const pathRef = $.path(path);
  const dst = $.path(`${config.keepBin}/${pathRef.basename()}`);
  await pathRef.copyFile(dst);
  logger.info(`(keepOriginalBin) Copy ${path} to ${dst}`);
}

export async function readRunpath(
  path: PathRefLike,
): Promise<string | undefined> {
  return (await $`${config.internalBin}/objdump -x ${$.path(path)}`.stderr(
    "null",
  )
    .noThrow()
    .apply((l) => {
      const e = $.split(l);
      if (e[0] != "RUNPATH") return;
      return e[1];
    })
    .text()).trimEnd();
}

async function implMimicDeploy(src: PathRefLike, dst: PathRefLike) {
  await $.path(src).copyFile($.path(dst));
  logger.info(`(deploy) Copy ${src} to ${dst}`);
  await $`${config.internalBin}/patchelf --add-needed libmimic-cross.so ${dst}`;

  const runpath = await readRunpath(dst);
  logger.debug(`(deploy) ${dst} RUNPATH is "${runpath}"`);
  if (!runpath) return;
  let needRunpathPatch = false;
  for (const p of runpath.split(":")) {
    if (!p.startsWith("$ORIGIN")) {
      needRunpathPatch = true;
      break;
    }
  }
  if (!needRunpathPatch) return;
  const newRunpath = runpath.replace(/^\//, `${config.hostRoot}/`).replace(
    ":/",
    `:${config.hostRoot}/`,
  );
  await $`${config.internalBin}/patchelf --set-rpath ${newRunpath} ${dst}`;
  logger.info(`(deploy) Modify RUNPATH in ${dst}`);
}

export function mimicDeploy(
  arg1: PathRefLike | string,
  arg2?: PathRefLike | string,
) {
  if (arg2 !== undefined) {
    return implMimicDeploy($.path(arg1), $.path(arg2));
  }
  const src = $.path(`${config.hostRoot}/${arg1}`);
  const dst = $.path(arg1);
  return implMimicDeploy(src, dst);
}

export async function deployIfHostCommands(
  commands: string[],
  blockList?: Set<string>,
) {
  for (const command of commands) {
    const hostPath = $.path(`${config.hostRoot}/${command}`);
    if (blockList && blockList.has(command)) continue;
    if (!(await isElfExecutable(hostPath))) continue;
    await mimicDeploy(hostPath, command);
  }
}
