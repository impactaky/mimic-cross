import { deployCli, keepOriginalBin, mimicize } from "../helper.ts";
import { setupMimicPython } from "../../src/python.ts";
import { config } from "../../config/config.ts";

export async function postInstall() {
  await setupMimicPython("python3.10");
  const pythonPath = "/usr/bin/python3.10";
  await keepOriginalBin(pythonPath);
  await mimicize(`${config.hostRoot}/${pythonPath}`);
  await deployCli("python", pythonPath, `--python ${pythonPath}`);
}
