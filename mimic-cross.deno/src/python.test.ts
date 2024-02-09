import { callMimicedPython, callNativePython, mimicPython } from "./python.ts";
import { assert, assertEquals } from "std/assert/mod.ts";
import { config } from "../config/config.ts";
import $ from "daxex/mod.ts";
import { runOnHost } from "./chroot.ts";

Deno.test("callNativePython", async () => {
  const machine = await callNativePython("/usr/bin/python3.10", [
    "-c",
    "import platform; print(platform.machine())",
  ]).text();
  assertEquals(machine, config.arch);
  const multiarch = await callNativePython("/usr/bin/python3.10", [
    "-c",
    "import sysconfig; print(sysconfig.get_config_vars('MULTIARCH'))",
  ]).text();
  assertEquals(multiarch, `['${config.arch}-linux-gnu']`);
});

Deno.test("callMimicedPython", async () => {
  const machine = await callMimicedPython("/usr/bin/python3.10", [
    "-c",
    "import platform; print(platform.machine())",
  ]).text();
  assertEquals(machine, config.arch);
  const multiarch = await callNativePython("/usr/bin/python3.10", [
    "-c",
    "import sysconfig; print(sysconfig.get_config_vars('MULTIARCH'))",
  ]).text();
  assertEquals(multiarch, `['${config.arch}-linux-gnu']`);
});

Deno.test("venv", async () => {
  const venvDir = $.path("mimic-cross-test-venv").resolve();
  const hostVenvDir = $.path(config.hostRoot).join(venvDir.toString());
  try {
    await mimicPython("/usr/bin/python3", [
      "-m",
      "venv",
      "mimic-cross-test-venv",
    ]);
    assert(venvDir.existsSync());
    assert(hostVenvDir.existsSync());
  } finally {
    await venvDir.remove({ recursive: true });
    await hostVenvDir.remove({ recursive: true });
  }
});

Deno.test("pip", async () => {
  await mimicPython("/usr/bin/python3", ["-m", "pip", "install", "jinja2"]);
  const pipList = await runOnHost(`python3 -m pip list`).text();
  assert(pipList.includes("MarkupSafe"));
  assert(!pipList.includes("Jinja2"));
});
