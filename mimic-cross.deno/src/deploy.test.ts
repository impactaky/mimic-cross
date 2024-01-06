import $ from "daxex/mod.ts";
import { mimicDeploy, readRunpath } from "./deploy.ts";
import { assert, assertEquals } from "std/assert/mod.ts";
import { checkNeeded, getElfMachine } from "../test/util.ts";

const testDataPath = $.path(Deno.env.get("MIMIC_TEST_DATA_PATH")!);
const deployDir = testDataPath.join("deploy");

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
  // TODO support multiarch
  assertEquals(await getElfMachine(deployBin), "Advanced Micro Devices X86-64");
});
