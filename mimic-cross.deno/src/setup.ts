import $ from "daxex/mod.ts";
import { config } from "../config/config.ts";
import { runOnHost } from "./chroot.ts";
import { deployInstalledPackages } from "../apt/apt.ts";

export async function setup() {
  await Promise.all([
    runOnHost("mknod /dev/random c 1 8"),
    runOnHost("mknod /dev/urandom c 1 9"),
    runOnHost("mknod /dev/null c 1 3"),
    runOnHost("mknod /dev/zero c 1 5"),
  ]);
  await runOnHost("chmod 666 /dev/random /dev/urandom /dev/null /dev/zero");
  await $.path(`${config.logFile}`).parent()?.mkdir({ recursive: true });
  await $.path(`${config.keepBin}`).mkdir({ recursive: true });
  await deployInstalledPackages();
}
