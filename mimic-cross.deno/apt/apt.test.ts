import { deployPackages, getIntalledPackagesFromLog } from "./apt.ts";
import { checkNeeded, getElfArch } from "../src/util.ts";
import $ from "dax/mod.ts";
import { assert, assertEquals } from "std/assert/mod.ts";
import { config } from "../config/config.ts";

Deno.test("deployPackages coreutils", async () => {
  await deployPackages(["coreutils"]);
  assert(await checkNeeded($.path("/bin/cat"), "libmimic-cross.so"));
  assertEquals(await getElfArch($.path("/bin/cat")), config.hostArch);
});

Deno.test("deployPackages libc-bin with blockList", async () => {
  await deployPackages(["libc-bin"]);
  assertEquals(await getElfArch($.path("/sbin/ldconfig.real")), config.arch);
  assertEquals(await getElfArch($.path("/usr/bin/locale")), config.hostArch);
});

Deno.test("getIntalledPackagesFromLog", async () => {
  const packages = await getIntalledPackagesFromLog(
    "2024-01-13 15:26:44",
    $.path("test/dpkg.log"),
  );
  assertEquals(packages, [
    "libtime-duration-perl",
    "moreutils",
    "man-db",
    "file",
    "libc-bin",
  ]);
});

Deno.test("getIntalledPackagesFromLog not found", async () => {
  const packages = await getIntalledPackagesFromLog(
    "2024-01-14 15:26:48",
    $.path("test/dpkg.log"),
  );
  assertEquals(packages, []);
});
