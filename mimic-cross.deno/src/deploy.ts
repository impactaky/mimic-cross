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

export async function mimicDeploy(src: PathRef, dst: PathRef) {
  const deployBin = dst.join(src.basename());
  await src.copyFile(deployBin);
  await $`${config.internalBin}/patchelf --add-needed libmimic-cross.so ${deployBin}`;

  const runpath = await readRunpath(deployBin);
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
  await $`${config.internalBin}/patchelf --set-rpath ${newRunpath} ${deployBin}`;
  await $.path("./target.log").appendText(
    `add ${config.hostRoot} prefix to RUNPATH in ${deployBin}\n`,
  );
}
