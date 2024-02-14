import $ from "daxex/mod.ts";
import { fileHas, mimicDeploy } from "../helper.ts";
import { logger } from "../../src/log.ts";
import { config } from "../../config/config.ts";

export async function postInstall() {
  const sudoPath = await $.which("sudo");
  if (sudoPath === undefined) {
    logger.error("Can't find sudo");
    throw new Error("Can't find sudo");
  }
  const sudoPathRef = $.path(sudoPath);
  await mimicDeploy(sudoPathRef);
  const conf = $.path("/etc/sudo.conf");
  const line = `Path plugin_dir ${config.hostRoot}/usr/libexec/sudo/\n`;
  if (await fileHas(conf, line)) return;
  await conf.appendText(line);
}
