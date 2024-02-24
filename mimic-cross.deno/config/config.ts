import $ from "daxex/mod.ts";

export let config = {
  arch: "set by loadConfig()",
  hostArch: "set by loadConfig()",
  hostRoot: "/mimic-cross",
  mimicCrossRoot: "/mimic-cross/mimic-cross.deno",
  internalRoot: "/mimic-cross/mimic-cross/internal",
  internalBin: "/mimic-cross/mimic-cross/internal/bin",
  keepBin: "/mimic-cross/mimic-cross/keep/bin",
  keepHostBin: "/mimic-cross/mimic-cross_bin",
  logFile: "/var/log/mimic-cross.log",
  logMode: "default", // default | verbose | debug
};

export async function loadConfig() {
  const configPath = $.path("/etc/mimic-cross/config.json");
  if (configPath.existsSync()) {
    const userConfig = await configPath.readJson<typeof config>();
    config = { ...config, ...userConfig };
  }
  config.hostArch = Deno.build.arch;
  config.arch = (await $`arch`.text()).trimEnd();
}

await loadConfig();
