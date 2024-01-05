import $ from "daxex/mod.ts";
import { mimicDeploy, readRunpath } from "./deploy.ts";
import { assert, assertEquals } from "std/assert/mod.ts";
import { PathRef } from "dax/mod.ts";

const testDataPath = $.path(Deno.env.get("MIMIC_TEST_DATA_PATH")!);
const deployDir = testDataPath.join("deploy");

async function checkNeeded(path: PathRef, needed: string): Promise<boolean> {
  const commandOut = await $`patchelf --print-needed ${path}`.lines();
  for (const line of commandOut) {
    if (line == needed) return true;
  }
  return false;
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
  await mimicDeploy(testDataPath.join("libhello_runpath.so"), deployDir);
  const deployBin = deployDir.join("libhello_runpath.so");
  const runpath = await readRunpath(deployBin);
  assertEquals(runpath, "$ORIGIN/foo:/mimic-cross/host/path/to/lib");
  assert(await checkNeeded(deployBin, "libmimic-cross.so"));
});

Deno.test("mimicDeploy no RUNPATH", async () => {
  await mimicDeploy(testDataPath.join("libhello.so"), deployDir);
  const deployBin = deployDir.join("libhello.so");
  assert(deployBin.existsSync());
  const runpath = await readRunpath(deployBin);
  assertEquals(runpath, "");
  assert(await checkNeeded(deployBin, "libmimic-cross.so"));
});
