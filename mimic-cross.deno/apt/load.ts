import $ from "daxex/mod.ts";
import { PackageInfo } from "./package.ts";

const packageDir = $.path(import.meta.url).parent()?.join("packages");
if (!packageDir) throw new Error("Package directory path is undefined.");

export const supportedPackagesPromise = (async () => {
  // Read default packages/supported.json
  const supportedPackages = await $.path(import.meta.url).parent()?.join(
    "packages",
    "supported.json",
  ).readJson<Record<string, PackageInfo>>();
  if (supportedPackages === undefined) {
    throw new Error("Can't read supported.json");
  }
  // Read user packages/supported.json
  return supportedPackages;
})();
