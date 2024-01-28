import { deployPackageCommands } from "../helper.ts";

export async function postInstall() {
  await deployPackageCommands("libc-bin", new Set(["/sbin/ldconfig.real"]));
}
