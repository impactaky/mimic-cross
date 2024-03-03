import $ from "daxex/mod.ts";
import { PathRefLike } from "daxex/mod.ts";
import { config } from "../config/config.ts";
import { logger } from "./log.ts";
import { keepOriginalBin } from "./deploy.ts";

export async function createTrampolineByZig(
  targetPath: PathRefLike,
  buildFile: string,
) {
  logger.info(
    `(createTrampolineByZig) Create trampoline for ${targetPath} by ${buildFile}`,
  );
  const targetPathRef = $.path(targetPath);
  const hostPathRef = $.path(`${config.hostRoot}/${targetPath}`);
  const keepedPathRef = await keepOriginalBin(hostPathRef);
  const tmpDir = await Deno.makeTempDir();
  try {
    await $`${config.internalBin}/zig build --build-file ${buildFile} -Dmimic_target=${keepedPathRef} -Dmimic_arch=${config.arch} -p ${tmpDir} --cache-dir ${tmpDir}/cache`
      .cwd(config.mimicCrossRoot + "/mimic-arg.zig");
    await $.path(`${tmpDir}/bin/${keepedPathRef.basename()}`).rename(
      hostPathRef,
    );
  } finally {
    await $.path(tmpDir).remove({ recursive: true });
  }
  await targetPathRef.remove();
  await targetPathRef.createSymlinkTo(hostPathRef.toString());
}

export async function createGccTrampoline(targetPath: PathRefLike) {
  await createTrampolineByZig(targetPath, "build_gcc.zig");
}

export async function createClangTrampoline(targetPath: PathRefLike) {
  await createTrampolineByZig(targetPath, "build_clang.zig");
}
