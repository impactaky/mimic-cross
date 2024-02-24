import { PackageInfo } from "../package_info.ts";
import { deployPackageCommands } from "../apt.ts";
import { createGccTrampoline } from "../../src/args.ts";
import { config } from "../../config/config.ts";

export async function postInstall(
  packageName: string,
  packageInfo: PackageInfo,
) {
  const matched = packageName.match(/^(gcc|g\+\+)-(\d+).+/);
  const version = matched?.[2];
  const versioned = matched?.slice(1, 3).join("-");
  if (packageInfo.blockList === undefined) packageInfo.blockList = [];
  const gccCrossPath = `/usr/lib/gcc-cross/${config.arch}-linux-gnu`;
  packageInfo.blockList.push(
    `/usr/bin/gcc-${config.arch}-linux-gnu-${versioned}`,
    `/usr/bin/g++-${config.arch}-linux-gnu-${versioned}`,
    `${gccCrossPath}/${version}/collect2`,
    `${gccCrossPath}/${version}/lto-wrapper`,
    `${gccCrossPath}/${version}/lto1`,
    `${gccCrossPath}/${version}/cc1plus`,
    `${gccCrossPath}/${version}/g++-mapper-server`,
  );
  await deployPackageCommands(packageName, packageInfo);
  await createGccTrampoline(`/usr/bin/${config.arch}-linux-gnu-${versioned}`);
}
