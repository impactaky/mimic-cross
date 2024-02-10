import $ from "daxex/mod.ts";
import { config } from "../config/config.ts";
import { logger } from "./log.ts";
import { runOnHost } from "./chroot.ts";

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
  const versionedPython = $.path(calledAs).realPathSync().basename();
  logger.debug(`(callNativePython) call native ${versionedPython}: ${args}`);
  return $.command([
    `${config.internalBin}/qemu-${config.arch}`,
    "-0",
    `${calledAs}`,
    `${config.keepBin}/${versionedPython}`,
    "--",
    ...args,
  ]).env({ ...Deno.env.toObject(), "MIMIC_CROSS_DISABLE": "1" });
}

export function callMimicedPython(
  calledAs: string,
  args: string[],
) {
  const versionedPython = $.path(calledAs).realPathSync().basename();
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
  return $.command([
    `${config.internalBin}/bash`,
    "-c",
    `exec -a ${calledAs} -- ${config.hostRoot}/${calledAs} "${
      args.join('" "')
    }"`,
  ])
    .env({
      ...Deno.env.toObject(),
      "PYTHONPATH": mimicedPythonPaths.join(":"),
      "LD_LIBRARY_PATH": mimicedLibraryPaths.join(":"),
    });
}

function detectModule(args: string[]): string | undefined {
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "-m") {
      if (i + 1 >= args.length) {
        throw new Error("Can't find module name after -m option.");
      }
      return args[i + 1];
    }
  }
  return undefined;
}

async function pip(calledAs: string, args: string[]) {
  logger.info(`(pip) Call native pip : ${args}`);
  const pipLog = Deno.makeTempFileSync({ dir: "/tmp", suffix: ".log" });
  await callNativePython(calledAs, [...args, "--log-file", pipLog]);
  try {
    const needMimic = await $.cat(pipLog).apply((l) => {
      const sep = $.split(l);
      if (sep[1] !== "Added") return;
      if (!l.includes(`${config.arch}.whl`)) return;
      return sep[2];
    }).lines();
    if (needMimic.length === 0) return;
    logger.info(`(pip) Call host pip install: ${needMimic}`);
    await runOnHost([calledAs, "-m", "pip", "install", ...needMimic]);
  } finally {
    if (logger.mode !== "DEBUG") {
      await $.path(pipLog).remove();
    }
  }
}

async function venv(calledAs: string, args: string[]) {
  // resolve venv directory
  let i = args.findIndex((arg) => arg === "-m") + 2;
  for (; i < args.length; i++) {
    if (args[i].startsWith("-")) continue;
    args[i] = $.path(args[i]).resolve().toString();
  }
  logger.info(`(venv) Call venv : ${args}`);
  await Promise.all([
    callMimicedPython(calledAs, args),
    runOnHost([calledAs, ...args]),
  ]);
}

export async function mimicPython(
  calledAs: string,
  args: string[],
): Promise<void> {
  logger.debug(`(mimicPython) called: ${calledAs}, ${args}`);
  if (Deno.env.get("MIMIC_CROSS_DISABLE") === "1") {
    await callNativePython(calledAs, args);
    return;
  }
  const module = detectModule(args);
  if (module !== undefined) {
    logger.info(`(mimicPython) Module detected: ${module}`);
  }
  switch (module) {
    case "venv":
      await venv(calledAs, args);
      break;
    case "pip":
      await pip(calledAs, args);
      break;
    default:
      await callNativePython(calledAs, args);
      break;
  }
}
