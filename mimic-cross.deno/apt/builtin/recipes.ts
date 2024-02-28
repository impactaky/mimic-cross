import {
  deployCli,
  deployPackageCommands,
  fileHas,
  keepOriginalBin,
  mimicDeploy,
  mimicize,
} from "../helper.ts";
import $ from "daxex/mod.ts";
import { config } from "../../config/config.ts";
import { logger } from "../../src/log.ts";
import { setupMimicPython } from "../../src/python.ts";
import { createGccTrampoline } from "../../src/args.ts";
import { PackageRecipe } from "../package.ts";

export function builtinRecipes(recipes: Map<string, PackageRecipe>) {
  recipes.set("default", {
    postInstall: async (name, info) => {
      await deployPackageCommands(name, info);
    },
  });

  recipes.set("skip", {});

  recipes.set("crossTool", {
    nameResolver: (name, _info) => {
      return [`${name}-${config.arch.replace("_", "-")}-linux-gnu`];
    },
  });

  recipes.set("apt", {
    postInstall: async (_name, _info) => {
      const aptGetPath = await $.which("apt-get");
      if (!aptGetPath) return;
      await keepOriginalBin(aptGetPath);
      await deployCli("apt-get", aptGetPath);
    },
  });

  recipes.set("gcc", {
    postInstall: async (name, info) => {
      const matched = name.match(/^(gcc|g\+\+)-(\d+).+/);
      const version = matched?.[2];
      const versioned = matched?.slice(1, 3).join("-");
      if (info.blockList === undefined) info.blockList = [];
      const gccCrossPath = `/usr/lib/gcc-cross/${config.arch}-linux-gnu`;
      info.blockList.push(
        `/usr/bin/gcc-${config.arch}-linux-gnu-${versioned}`,
        `/usr/bin/g++-${config.arch}-linux-gnu-${versioned}`,
        `${gccCrossPath}/${version}/collect2`,
        `${gccCrossPath}/${version}/lto-wrapper`,
        `${gccCrossPath}/${version}/lto1`,
        `${gccCrossPath}/${version}/cc1plus`,
        `${gccCrossPath}/${version}/g++-mapper-server`,
      );
      await deployPackageCommands(name, info);
      await createGccTrampoline(
        `/usr/bin/${config.arch}-linux-gnu-${versioned}`,
      );
    },
  });

  recipes.set("sudo", {
    postInstall: async (_name, _info) => {
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
    },
  });

  recipes.set("python", {
    postInstall: async (name, _info) => {
      const matched = name.match(/^(python\d+\.\d+)-minimal/);
      const versionedPython = matched?.[1];
      if (!versionedPython) {
        throw new Error(`Can't parse python version: ${name}`);
      }
      await setupMimicPython(versionedPython);
      const pythonPath = `/usr/bin/${versionedPython}`;
      await keepOriginalBin(pythonPath);
      await mimicize(`${config.hostRoot}/${pythonPath}`);
      await deployCli("python", pythonPath, '--python "$0"');
    },
  });
}
