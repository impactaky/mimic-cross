import $ from "daxex/mod.ts";
import { prepareChroot, runOnHost } from "../src/chroot.ts";
import { config } from "../config/config.ts";

const packageDir = $.path(import.meta.url).parent()?.join("packages");
if (!packageDir) throw new Error("Package directory path is undefined.");
const supportedPackagesPromise = (async () => {
  const supportedPackages = new Set<string>();
  for await (const file of packageDir.readDir()) {
    if (!file.isFile) continue;
    supportedPackages.add(file.name.replace(/\.ts$/, ""));
  }
  return supportedPackages;
})();

export async function aptGetOnHost(arg: string) {
  await prepareChroot;
  const args = $.split(arg);
  if (args[0] === "install" && Deno.env.get("HOSTNAME") === "buildkitsandbox") {
    await runOnHost(`apt-get update`);
    console.log(`${args.slice(1).join(" ")}`);
    await runOnHost(
      `apt-get install -y --no-install-recommends ${args.slice(1).join(" ")}`,
    ).env("DEBIAN_FRONTEND", "noninteractive");
    await runOnHost(`apt-get clean`);
    await $.path(`${config.hostRoot}/var/lib/apt/lists`).remove({
      recursive: true,
    });
    return;
  }
  await runOnHost(`apt-get ${arg}`);
  return;
}

export async function deployPackages(packages: string[]) {
  const supportedPackages = await supportedPackagesPromise;
  const filteredPackages = packages.filter((p) => supportedPackages.has(p));
  await aptGetOnHost(`install -y --no-install-recommends ${filteredPackages.join(" ")}`);
  for (const p of filteredPackages) {
    const module = await import(`${packageDir}/${p}.ts`);
    if (module.postInstall && typeof module.postInstall === "function") {
      await module.postInstall();
    }
  }
}

export async function deployInstalledPackages() {
  const installedPackages = await $`dpkg -l`.apply((l) => {
    const e = $.split(l);
    if (e[0] !== "ii") return;
    return e[1];
  }).lines();
  await deployPackages(installedPackages);
} 
