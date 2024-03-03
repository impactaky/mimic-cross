import { assert, assertEquals } from "std/assert/mod.ts";
import $ from "daxex/mod.ts";
import { getElfArch } from "./util.ts";
import { config } from "../config/config.ts";

Deno.test("callGccWithNative", async () => {
  const text =
    await $`gcc -mcpu=native -march=native -mtune=native -Q --help=target`
      .text();
  const match = text.match(/-march=\S*.+|-mcpu=\S*.+|-mtune=\S*.+/g);
  assert(match !== null);
  const values = match.map((m) => m.split("=")[1].trim());
  assertEquals(values[0], "armv8-a"); // arch
  assertEquals(values[1], "generic"); // cpu
  assertEquals(values[2], "generic"); // tune
});

Deno.test("callGccWithEnv", async () => {
  const text =
    await $`gcc -mcpu=native -march=native -mtune=native -Q --help=target`
      .env({
        "MIMIC_CROSS_GCC_NATIVE_ARCH": "armv8.2-a",
        "MIMIC_CROSS_GCC_NATIVE_CPU": "cortex-a75",
        "MIMIC_CROSS_GCC_NATIVE_TUNE": "cortex-a75",
      })
      .text();
  const match = text.match(/-march=\s*(\S+)|-mcpu=\s*(\S+)|-mtune=\s*(\S+)/g);
  assert(match !== null);
  const values = match.map((m) => m.split("=")[1].trim());
  assertEquals(values[0], "armv8.2-a"); // arch
  assertEquals(values[1], "cortex-a75"); // cpu
  assertEquals(values[2], "cortex-a75"); // tune
});

Deno.test("callG++WithNative", async () => {
  const text =
    await $`g++ -mcpu=native -march=native -mtune=native -Q --help=target`
      .text();
  const match = text.match(/-march=\S*.+|-mcpu=\S*.+|-mtune=\S*.+/g);
  assert(match !== null);
  const values = match.map((m) => m.split("=")[1].trim());
  assertEquals(values[0], "armv8-a"); // arch
  assertEquals(values[1], "generic"); // cpu
  assertEquals(values[2], "generic"); // tune
});

Deno.test("callG++WithEnv", async () => {
  const text =
    await $`g++ -mcpu=native -march=native -mtune=native -Q --help=target`
      .env({
        "MIMIC_CROSS_GCC_NATIVE_ARCH": "armv8.2-a",
        "MIMIC_CROSS_GCC_NATIVE_CPU": "cortex-a75",
        "MIMIC_CROSS_GCC_NATIVE_TUNE": "cortex-a75",
      })
      .text();
  const match = text.match(/-march=\s*(\S+)|-mcpu=\s*(\S+)|-mtune=\s*(\S+)/g);
  assert(match !== null);
  const values = match.map((m) => m.split("=")[1].trim());
  assertEquals(values[0], "armv8.2-a"); // arch
  assertEquals(values[1], "cortex-a75"); // cpu
  assertEquals(values[2], "cortex-a75"); // tune
});

Deno.test("clang", async () => {
  assertEquals(await getElfArch("/usr/bin/clang"), config.hostArch);
  await $`clang -o /tmp/main /test/main.c`;
});

Deno.test("clang-15", async () => {
  assertEquals(await getElfArch("/usr/bin/clang-15"), config.hostArch);
  await $`clang-15 -o /tmp/main /test/main.c`;
});
