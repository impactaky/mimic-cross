import $ from "daxex/mod.ts";
import { config } from "../config/config.ts";
import { logger } from "./log.ts";

export async function setupMimicPython(versionedPython: string) {
  const configVarsPickle = $.path(`${config.internalRoot}/config_vars.pickle`);
  if (!configVarsPickle.existsSync()) {
    await $`${versionedPython} ${config.mimicCrossRoot}/python/save_config_vars.py`;
  }
  await $`${config.internalBin}/patch --forward ${config.hostRoot}/usr/lib/${versionedPython}/sysconfig.py`
    .stdin($.path(`${config.mimicCrossRoot}/python/sysconfig.patch`));
}

export function callNativePython(
  calledAs: string,
  args: string[],
) {
  const versionedPython = $.path(calledAs).basename();
  return $.command([
    `${config.internalBin}/qemu-${config.arch}`,
    "-0",
    `${calledAs}`,
    `${config.keepBin}/${versionedPython}`,
    "--",
    ...args,
  ]);
}

export function callMimicedPython(
  calledAs: string,
  args: string[],
) {
  const versionedPython = $.path(calledAs).basename();
  const mimicedPythonPaths: string[] = [];
  const userPythonPath = Deno.env.get("PYTHONPATH");
  if (userPythonPath) {
    for (const path of userPythonPath.split(":")) {
      mimicedPythonPaths.push(`${config.hostRoot}/${path}`);
    }
  }
  mimicedPythonPaths.push(...[
    `${config.hostRoot}/usr/lib/${versionedPython.replace(".", "")}.zip`,
    `${config.hostRoot}/usr/lib/${versionedPython}`,
    `${config.hostRoot}/usr/lib/${versionedPython}/lib-dynload`,
  ]);
  const venvPath = Deno.env.get("VIRTUAL_ENV");
  if (venvPath) {
    mimicedPythonPaths.push(
      `${config.hostRoot}/${venvPath}/lib/${versionedPython}/site-packages`,
    );
  } else {
    mimicedPythonPaths.push(...[
      `${config.hostRoot}/usr/local/lib/${versionedPython}/dist-packages`,
      `${config.hostRoot}/usr/lib/python3/dist-packages`,
      `${config.hostRoot}/usr/lib/${versionedPython}/dist-packages`,
    ]);
  }
  if (userPythonPath) {
    mimicedPythonPaths.push(userPythonPath);
  }

  const mimicedLibraryPaths: string[] = [];
  const userLibraryPath = Deno.env.get("LD_LIBRARY_PATH");
  if (userLibraryPath) {
    for (const path of userLibraryPath.split(":")) {
      mimicedLibraryPaths.push(`${config.hostRoot}/${path}`);
    }
    mimicedLibraryPaths.push(userLibraryPath);
  }

  logger.debug(`(callMimicedPython) call mimiced python`);
  return $.command([`${config.hostRoot}/${calledAs}`, ...args])
    .env({
      "PYTHONPATH": mimicedPythonPaths.join(":"),
      "LD_LIBRARY_PATH": mimicedLibraryPaths.join(":"),
    });
}

export async function mimicPython(
  calledAs: string,
  args: string[],
): Promise<void> {
  logger.debug(`(mimicPython) called: ${calledAs}, ${args}`);
  if (Deno.env.get("MIMIC_CROSS_DISABLE") === "1") {
    await callNativePython(calledAs, args);
  } else {
    await callMimicedPython(calledAs, args);
  }
}
