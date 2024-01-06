import { deployPackages } from "./apt.ts";
import { checkNeeded, getElfMachine } from "../test/util.ts";
import $ from "dax/mod.ts";
import { assert, assertEquals } from "std/assert/mod.ts";

Deno.test("deployPackages coreutils", async () => {
  await deployPackages(["coreutils"]);
  assert(await checkNeeded($.path("/bin/cat"), "libmimic-cross.so"));
  assertEquals(
    await getElfMachine($.path("/bin/cat")),
    "Advanced Micro Devices X86-64",
  );
});
