import { PackageInfo } from "../package_info.ts";
import { deployPackageCommands } from "../apt.ts";
import { createGccTrampoline } from "../../src/gcc.ts";
import { config } from "../../config/config.ts";

export async function postInstall(
  packageName: string,
  packageInfo: PackageInfo,
) {
  const version = packageName.match(/^gcc-(\d+).+/)?.[1];
  if (packageInfo.blockList === undefined) packageInfo.blockList = [];
  const gccCrossPath = `/usr/lib/gcc-cross/${config.arch}-linux-gnu`;
  packageInfo.blockList.push(
    `${gccCrossPath}/${version}/collect2`,
    `${gccCrossPath}/${version}/lto-wrapper`,
    `${gccCrossPath}/${version}/lto1`,
  );
  await deployPackageCommands(packageName, packageInfo);
  await createGccTrampoline(`/usr/bin/${config.arch}-linux-gnu-gcc-${version}`);
}
