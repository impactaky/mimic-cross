import $ from "daxex/mod.ts";
import { findCommands, mimicDeploy, readRunpath } from "./deploy.ts";
import { assert, assertEquals } from "std/assert/mod.ts";
import { checkNeeded, getElfArch } from "./util.ts";
import { config } from "../config/config.ts";

const testDataPath = $.path(Deno.env.get("MIMIC_TEST_DATA_PATH")!);
const deployDir = testDataPath.join("deploy");

Deno.test("readRunPath no RUNPATH", async () => {
  const runpath = await readRunpath(testDataPath.join("libhello.so"));
  assertEquals(runpath, "");
});

Deno.test("readRunPath", async () => {
  const runpath = await readRunpath(testDataPath.join("libhello_runpath.so"));
  assertEquals(runpath, "$ORIGIN/foo:/path/to/lib");
});

Deno.test("mimicDeploy", async () => {
  const hostBin = testDataPath.join("libhello_runpath.copied.so");
  await testDataPath.join("libhello_runpath.so").copyFile(hostBin);
  const deployBin = deployDir.join("libhello_runpath.so");
  await mimicDeploy(hostBin, deployBin);
  assertEquals(
    await readRunpath(deployBin),
    `${config.hostRoot}//path/to/lib:$ORIGIN/foo:/path/to/lib`,
  );
  assert(await checkNeeded(deployBin, "libmimic-cross.so"));
  // Does not increase prefix
  await mimicDeploy(hostBin, deployBin);
  assertEquals(
    await readRunpath(deployBin),
    `${config.hostRoot}//path/to/lib:$ORIGIN/foo:/path/to/lib`,
  );
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
  assertEquals(await getElfArch(deployBin), config.hostArch);
});

Deno.test("findCommands", async () => {
  const commands = await findCommands([
    `${config.hostRoot}/bin/grep`,
    `${config.hostRoot}/usr/lib/libsystemd.so.0.28.0`,
  ]);
  assertEquals(commands, [`${config.hostRoot}/bin/grep`]);
});
