import { PackageInfo } from "../package_info.ts";
import { deployPackageCommands } from "../apt.ts";
import { createGccTrampoline } from "../../src/gcc.ts";
import { config } from "../../config/config.ts";

export async function postInstall(
  packageName: string,
  packageInfo: PackageInfo,
) {
  const version = packageName.match(/^g\+\+-(\d+).+/)?.[1];
  if (packageInfo.blockList === undefined) packageInfo.blockList = [];
  const gccCrossPath = `/usr/lib/gcc-cross/${config.arch}-linux-gnu`;
  packageInfo.blockList.push(
    `${gccCrossPath}/${version}/cc1plus`,
    `${gccCrossPath}/${version}/g++-mapper-server`,
  );
  await deployPackageCommands(packageName, packageInfo);
  await createGccTrampoline(`/usr/bin/${config.arch}-linux-gnu-g++-${version}`);
}
