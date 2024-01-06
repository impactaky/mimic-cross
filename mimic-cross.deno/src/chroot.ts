import $ from "daxex/mod.ts";
import { config } from "config/config.ts";

export const prepareChroot = (async () => {
  return await $.path("/etc/resolv.conf").copyFile(
    $.path(`${config.hostRoot}/etc/resolv.conf`),
  );
})();
// await prepareChroot;

export function runOnHost(command: string | string[]) {
  const commands: string[] = typeof command === "string"
    ? command.split(" ")
    : command;
  return $`${config.internalBin}/chroot ${config.hostRoot} ${commands}`;
}
