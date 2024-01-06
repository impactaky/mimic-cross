import $ from "daxex/mod.ts";
import { PathRef } from "dax/mod.ts";
import { config } from "config/config.ts";

export async function readRunpath(path: PathRef): Promise<string | undefined> {
  return (await $`${config.internalBin}/objdump -x ${path}`.stderr("null")
    .noThrow()
    .apply((l) => {
      const e = $.split(l);
      if (e[0] != "RUNPATH") return;
      return e[1];
    })
    .text()).trimEnd();
}

async function implMimicDeploy(src: PathRef, dst: PathRef) {
  await src.copyFile(dst);
  await $`${config.internalBin}/patchelf --add-needed libmimic-cross.so ${dst}`;

  const runpath = await readRunpath(dst);
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
  await $.path("./target.log").appendText(
    `add ${config.hostRoot} prefix to RUNPATH in ${dst}\n`,
  );
}

export function mimicDeploy(arg1: PathRef | string, arg2?: PathRef | string) {
  if (arg2 !== undefined) {
    return implMimicDeploy($.path(arg1), $.path(arg2));
  }
  const src = $.path(`${config.hostRoot}/${arg1}`);
  const dst = $.path(arg1);
  return implMimicDeploy(src, dst);
}
