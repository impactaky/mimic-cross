import $ from "daxex/mod.ts";
import { PathRefLike } from "daxex/mod.ts";
import { config } from "../config/config.ts";
import { logger } from "./log.ts";
import { isElfExecutable, isInPath, parseLdconf } from "./util.ts";

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

async function mimic(path: PathRefLike) {
  await $`${config.internalBin}/patchelf --add-needed libmimic-cross.so ${path}`;
  const runpath = await readRunpath(path);
  logger.debug(`(deploy) ${path} RUNPATH is "${runpath}"`);
  if (!runpath) return;
  const runpaths = runpath.split(":");
  const newRunpaths: string[] = [];
  for (const p of runpaths) {
    if (p.startsWith("$ORIGIN")) continue;
    if (p.startsWith(config.hostRoot)) continue;
    const mimicedPath = `${config.hostRoot}/${p}`;
    if (runpaths.includes(mimicedPath)) continue;
    newRunpaths.push(mimicedPath);
  }
  if (newRunpaths.length === 0) return;
  const newRunpath = newRunpaths.join(":");
  await $`${config.internalBin}/patchelf --set-rpath ${newRunpath}:${runpath} ${path}`;
  logger.info(`(deploy) Modify RUNPATH in ${path}`);
}

async function implMimicDeploy(src: PathRefLike, dst: PathRefLike) {
  const dstPathRef = $.path(dst);
  await mimic(src);
  if (dstPathRef.existsSync()) {
    await dstPathRef.remove();
  }
  await $.path(dst).createSymlinkTo($.path(src).toString());
  logger.info(`(deploy) Symlink ${dst} to ${src}`);
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
  const libDirs = await parseLdconf(`${config.hostRoot}/etc/ld.so.conf`);
  for (const command of commands) {
    const hostPath = $.path(`${config.hostRoot}/${command}`);
    if (blockList && blockList.has(command)) continue;
    if (!(await isElfExecutable(hostPath))) continue;
    if (isInPath(command, libDirs)) continue;
    if (!isInPath(command)) {
      logger.info(`(deployIfHostCommands) ${command} is not in PATH`);
    }
    await mimicDeploy(hostPath, command);
  }
}

export async function findCommands(paths: string[]) {
  const libDirs = await parseLdconf(`/etc/ld.so.conf`);
  const commands: string[] = [];
  for (const path of paths) {
    if (!(await isElfExecutable(path))) continue;
    if (isInPath(path, libDirs)) continue;
    commands.push(path);
  }
  return commands;
}
