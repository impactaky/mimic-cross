import $ from "daxex/mod.ts";

export let config = {
  arch: "set by loadConfig()",
  hostArch: "set by loadConfig()",
  hostRoot: "/mimic-cross/host",
  internalBin: "/mimic-cross/host/mimic-cross/internal/bin",
  keepBin: "/mimic-cross/keep/bin",
  logFile: "/var/log/mimic-cross.log",
  logMode: "default", // default | verbose | debug
};

export async function loadConfig() {
  const configPath = $.path("/mimic-cross/config.json");
  if (configPath.existsSync()) {
    const userConfig = await configPath.readJson<typeof config>();
    config = { ...config, ...userConfig };
  }
  config.hostArch = Deno.build.arch;
  config.arch = (await $`arch`.text()).trimEnd();
}

await loadConfig();
