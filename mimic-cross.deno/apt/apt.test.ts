import { deployPackages } from "./apt.ts";
import { checkNeeded, getElfArch } from "../src/util.ts";
import $ from "dax/mod.ts";
import { assert, assertEquals } from "std/assert/mod.ts";

Deno.test("deployPackages coreutils", async () => {
  await deployPackages(["coreutils"]);
  assert(await checkNeeded($.path("/bin/cat"), "libmimic-cross.so"));
  assertEquals(await getElfArch($.path("/bin/cat")), "x86_64");
});
