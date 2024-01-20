import $ from "daxex/mod.ts";
import { assert, assertEquals } from "std/assert/mod.ts";
import { isElfExecutable, isInPath, parseLdconf } from "./util.ts";
import { config } from "../config/config.ts";

Deno.test("isElfExecutable native", async () => {
  const ret = await isElfExecutable("/bin/cat");
  assert(ret);
});

Deno.test("isElfExecutable host", async () => {
  const ret = await isElfExecutable(`${config.hostRoot}/bin/cat`);
  assert(ret);
});

Deno.test("isElfExecutable(directory)", async () => {
  const ret = await isElfExecutable($.path("/usr/libexec"));
  assert(!ret);
});

Deno.test("isInPath", () => {
  assert(!isInPath("/foo/var/cli", ["/foo"]));
  assert(isInPath("/foo/var/cli", ["/foo/var"]));
});

Deno.test("parse /etc/ld.so.conf", async () => {
  const dirs = await parseLdconf("/etc/ld.so.conf");
  assertEquals(dirs, [
    "/usr/local/lib/aarch64-linux-gnu",
    "/lib/aarch64-linux-gnu",
    "/usr/lib/aarch64-linux-gnu",
    "/usr/local/lib",
  ]);
});
