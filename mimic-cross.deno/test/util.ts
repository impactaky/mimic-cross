import $ from "daxex/mod.ts";
import { PathRef } from "dax/mod.ts";
import { config } from "../config/config.ts";

export async function checkNeeded(
  path: PathRef,
  needed: string,
): Promise<boolean> {
  const commandOut =
    await $`${config.internalBin}/patchelf --print-needed ${path}`.lines();
  for (const line of commandOut) {
    if (line == needed) return true;
  }
  return false;
}

export async function getElfMachine(path: PathRef): Promise<string> {
  return (await $`${config.internalBin}/readelf -h ${path}`.apply((l) => {
    const e = l.split(":");
    if (e[0].trim() !== "Machine") return;
    return e[1].trim();
  }).text()).trimEnd();
}
