import $ from "daxex/mod.ts";
import { config } from "../config/config.ts";

let chrootPrepared = false;
export function runOnHost(command: string | string[]) {
  if (!chrootPrepared) {
    $.path("/etc/resolv.conf").copyFileSync(
      $.path(`${config.hostRoot}/etc/resolv.conf`),
    );
    chrootPrepared = true;
  }
  if (typeof command === "string") {
    return $.command(
      `${config.internalBin}/chroot ${config.hostRoot} ${command}`,
    );
  } else {
    return $.command([
      `${config.internalBin}/chroot`,
      config.hostRoot,
      ...command,
    ]);
  }
}
