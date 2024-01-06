import $ from "daxex/mod.ts";
import { mimicDeploy, readRunpath } from "./deploy.ts";
import { assert, assertEquals } from "std/assert/mod.ts";
import { PathRef } from "dax/mod.ts";
import { config } from "config/config.ts";

const testDataPath = $.path(Deno.env.get("MIMIC_TEST_DATA_PATH")!);
const deployDir = testDataPath.join("deploy");

async function checkNeeded(path: PathRef, needed: string): Promise<boolean> {
  const commandOut =
    await $`${config.internalBin}/patchelf --print-needed ${path}`.lines();
  for (const line of commandOut) {
    if (line == needed) return true;
  }
  return false;
}

async function getElfMachine(path: PathRef): Promise<string> {
  return (await $`${config.internalBin}/readelf -h ${path}`.apply((l) => {
    const e = l.split(":");
    if (e[0].trim() !== "Machine") return;
    return e[1].trim();
  }).text()).trimEnd();
}

Deno.test("readRunPath", async () => {
  const runpath = await readRunpath(testDataPath.join("libhello.so"));
  assertEquals(runpath, "");
});

Deno.test("readRunPath no RUNPATH", async () => {
  const runpath = await readRunpath(testDataPath.join("libhello_runpath.so"));
  assertEquals(runpath, "$ORIGIN/foo:/path/to/lib");
});

Deno.test("mimicDeploy", async () => {
  const deployBin = deployDir.join("libhello_runpath.so");
  await mimicDeploy(testDataPath.join("libhello_runpath.so"), deployBin);
  const runpath = await readRunpath(deployBin);
  assertEquals(runpath, "$ORIGIN/foo:/mimic-cross/host/path/to/lib");
  assert(await checkNeeded(deployBin, "libmimic-cross.so"));
});

Deno.test("mimicDeploy no RUNPATH", async () => {
  const deployBin = deployDir.join("libhello.so");
  await mimicDeploy(testDataPath.join("libhello.so"), deployBin);
  assert(deployBin.existsSync());
  const runpath = await readRunpath(deployBin);
  assertEquals(runpath, "");
  assert(await checkNeeded(deployBin, "libmimic-cross.so"));
});

Deno.test("mimicDeploy /bin/ls", async () => {
  await mimicDeploy("/bin/ls");
  const deployBin = $.path("/bin/ls");
  assert(deployBin.existsSync());
  const runpath = await readRunpath(deployBin);
  assertEquals(runpath, "");
  assert(await checkNeeded(deployBin, "libmimic-cross.so"));
  assertEquals(await getElfMachine(deployBin), "Advanced Micro Devices X86-64");
});
