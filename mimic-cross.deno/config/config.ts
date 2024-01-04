import $ from "daxex/mod.ts";

export let config = {
  hostRoot: "/mimic-cross/host",
};

export async function loadConfig() {
  const configPath = $.path("/mimic-cross/config.json");
  if (configPath.existsSync()) {
    const userConfig = await configPath.readJson<typeof config>();
    config = { ...config, ...userConfig };
  }
}

await loadConfig();
