import $ from "daxex/mod.ts";
import { config, loadConfig } from "./config.ts";
import { assertEquals } from "std/assert/assert_equals.ts";

Deno.test("config", async () => {
  const testConfig = {
    hostRoot: "/host",
  };
  assertEquals(config.hostRoot, "/mimic-cross/host");
  const configPath = $.path("/mimic-cross/config.json");
  await configPath.writeJson(testConfig);
  await loadConfig();
  assertEquals(config.hostRoot, "/host");
  await configPath.remove();
});