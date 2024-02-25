import $ from "daxex/mod.ts";
import { deployCli } from "../../../apt/helper.ts";
import { keepOriginalBin } from "../../../src/deploy.ts";

export async function postInstall() {
  const aptGetPath = await $.which("apt-get");
  console.log(aptGetPath);
  if (!aptGetPath) return;
  await keepOriginalBin(aptGetPath);
  await deployCli("apt-get", aptGetPath);
}
