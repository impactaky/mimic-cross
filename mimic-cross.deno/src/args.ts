import $ from "daxex/mod.ts";
import { PathRefLike } from "daxex/mod.ts";
import { config } from "../config/config.ts";
import { logger } from "./log.ts";

export async function createGccTrampoline(targetPath: PathRefLike) {
  logger.info(`(createGccTrampoline) Create gcc trampoline for ${targetPath}`);
  const tmpDir = await Deno.makeTempDir();
  const targetPathRef = $.path(targetPath);
  const keepedPathRef = $.path(config.keepHostBin).join(
    targetPathRef.basename(),
  );
  const hostPathRef = $.path(`${config.hostRoot}/${targetPath}`);
  await hostPathRef.rename(keepedPathRef);
  await $`${config.internalBin}/zig build --build-file build_gcc.zig -Dmimic_target=${keepedPathRef} -Dmimic_arch=${config.arch} -Doptimize=ReleaseSmall -p ${tmpDir} --cache-dir ${tmpDir}/cache`
    .cwd(config.mimicCrossRoot + "/mimic-arg.zig");
  await $.path(`${tmpDir}/bin/${targetPathRef.basename()}`).rename(hostPathRef);
  await targetPathRef.remove();
  await targetPathRef.createSymlinkTo(hostPathRef.toString());
}
