import $ from "daxex/mod.ts";
import {
  callPostInstall,
  getSupportedPackagesFrom,
} from "mimic-cross/apt/package.ts";
import { assertEquals } from "std/assert/mod.ts";

Deno.test("mimic-custom-recipe", async () => {
  const packages = getSupportedPackagesFrom(["mimic-custom-recipe"]);
  assertEquals(packages, ["mimic-custom-recipe"]);
  await callPostInstall(packages);
  const path = $.path("/test/custom_recipe");
  try {
    assertEquals(await path.readText(), "mimic-custom-recipe");
  } finally {
    await path.remove();
  }
});
