import $ from "daxex/mod.ts";
import { PathRefLike } from "daxex/mod.ts";
import { config } from "../config/config.ts";

export async function checkNeeded(
  path: PathRefLike,
  needed: string,
): Promise<boolean> {
  const commandOut = await $`${config.internalBin}/patchelf --print-needed ${
    $.path(path)
  }`.lines();
  for (const line of commandOut) {
    if (line == needed) return true;
  }
  return false;
}

export async function getElfArch(
  path: PathRefLike,
): Promise<string | undefined> {
  const machine =
    (await $`${config.internalBin}/readelf -h ${$.path(path)}`.noThrow().stderr(
      "null",
    )
      .apply((l) => {
        const e = l.split(":");
        if (e[0].trim() !== "Machine") return;
        return e[1].trim();
      }).text()).trimEnd();
  switch (machine) {
    case "Advanced Micro Devices X86-64":
      return "x86_64";
    case "AArch64":
      return "aarch64";
    default:
      return;
  }
}

export async function getElfType(
  path: PathRefLike,
): Promise<string | undefined> {
  const type =
    (await $`${config.internalBin}/readelf -h ${$.path(path)}`.noThrow().stderr(
      "null",
    )
      .apply((l) => {
        const e = $.split(l);
        if (e[0].trim() !== "Type:") return;
        return e[1];
      }).text()).trimEnd();
  return type;
}

export async function isElfExecutable(path: PathRefLike): Promise<boolean> {
  const pathRef = $.path(path);
  if (!pathRef.isFileSync() || pathRef.isSymlinkSync()) return false;
  // path is executable
  const ret = await $`[ -x ${pathRef} ]`.noThrow();
  if (ret.code !== 0) return false;
  const type = await getElfType(pathRef);
  if (!type) return false;
  if (type === "EXEC" || type === "DYN") return true;
  return false;
}

export function isInPATH(filePath: PathRefLike, paths?: string[]) {
  filePath = $.path(filePath);
  paths = paths ? paths : Deno.env.get("PATH")?.split(":");
  if (!paths) return false;
  for (const p of paths) {
    if (filePath.dirname() === p) return true;
  }
  return false;
}

export async function parseLdconf(filePath: PathRefLike): Promise<string[]> {
  const pathRef = $.path(filePath);
  const text = await pathRef.readText();
  const ldconfDirs: string[] = [];
  for (const line of text.split("\n")) {
    if (line.startsWith("#")) continue;
    if (line.startsWith("include ")) {
      const included = line.slice("include ".length).trim();
      for await (const entry of pathRef.expandGlob(included)) {
        ldconfDirs.push(...(await parseLdconf(entry.path)));
      }
      continue;
    }
    if (line.trim() === "") continue;
    ldconfDirs.push(line.trim());
  }
  return ldconfDirs;
}
