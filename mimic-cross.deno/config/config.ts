import $ from "daxex/mod.ts";

export let config = {
  hostRoot: "/mimic-cross/host",
  internalBin: "/mimic-cross/host/mimic-cross/internal/bin",
};

export async function loadConfig() {
  const configPath = $.path("/mimic-cross/config.json");
  if (configPath.existsSync()) {
    const userConfig = await configPath.readJson<typeof config>();
    config = { ...config, ...userConfig };
  }
}

await loadConfig();
