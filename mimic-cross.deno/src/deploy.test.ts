import $ from "daxex/mod.ts";
import { mimicDeploy, readRunpath } from "./deploy.ts";
import { assertEquals } from "std/testing/asserts.ts";

const testDataPath = $.path(Deno.env.get("MIMIC_TEST_DATA_PATH")!);
const deployDir = testDataPath.join("deploy");

Deno.test("readRunPath", async () => {
  const rpath = await readRunpath(testDataPath.join("libhello.so"));
  assertEquals(rpath, "");
});

Deno.test("readRunPath no RUNPATH", async () => {
  const rpath = await readRunpath(testDataPath.join("libhello_runpath.so"));
  assertEquals(rpath, "$ORIGIN/foo:/path/to/lib");
});

Deno.test("mimicDeploy", async () => {
  await mimicDeploy(testDataPath.join("libhello_runpath.so"), deployDir);
});
