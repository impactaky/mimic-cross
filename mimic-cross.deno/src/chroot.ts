import $ from "daxex/mod.ts";
import { config } from "config/config.ts";

export const prepareChroot = (async () => {
  return await $.path("/etc/resolv.conf").copyFile(
    $.path(`${config.hostRoot}/etc/resolv.conf`),
  );
})();
// await prepareChroot;

export function runOnHost(command: string | string[]) {
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
