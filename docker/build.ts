import { Command } from "cliffy/command/mod.ts";
import $ from "daxex/mod.ts";

const internalHost = "mimic-cross-host-finalize";
const internalImage = "mimic-cross-finalize";

const bakeJson = {
  target: {
    default: {
      context: ".",
      dockerfile: "Dockerfile",
      platforms: ["linux/amd64", "linux/arm64"],
      target: internalImage,
      output: [""],
      args: {},
      tags: [""],
    },
  },
};

function getNameAndTag(image: string) {
  const name = image.includes(":") ? image.split(":")[0] : image;
  const tag = image.includes(":") ? image.split(":")[1] : "latest";
  return { name, tag };
}

await new Command()
  .name("create-mimic-image")
  .version("0.1.0")
  .description("Build mimic-cross image from base image")
  .option("--host-base-image <hostBaseImage:string>", "Specify base host image")
  .option("--host", "Build host image")
  .option("--push", "Same docker buildx push")
  .arguments("<baseImage:string> <targetArch:string> <outputImage:string>")
  .action(async (options, baseImage, targetArch, outputImage) => {
    const base = getNameAndTag(baseImage);
    const host = getNameAndTag(options.hostBaseImage || baseImage);
    const output = getNameAndTag(outputImage);

    const appendTexts: string[] = [];
    for (const platform of bakeJson.target.default.platforms) {
      const arch = platform.split("/")[1];
      if (arch === targetArch) {
        appendTexts.push(
          `FROM mimic-host-native AS ${internalHost}-${arch}`,
        );
      } else {
        appendTexts.push(`FROM mimic-host AS ${internalHost}-${arch}`);
      }
    }
    appendTexts.push(
      `FROM ${internalHost}-$\{TARGETARCH\} AS ${internalHost}`,
      `FROM --platform=linux/${targetArch} ${base.name}:${base.tag} AS ${internalImage}`,
      `COPY --from=${internalHost} / /mimic-cross`,
      `RUN /mimic-cross/mimic-cross.deno/setup.sh`,
    );
    const text = await $.path(import.meta.url).parent()?.join("base.dockerfile")
      .readText();
    await $.path("Dockerfile").writeText(text + "\n" + appendTexts.join("\n"));
    bakeJson.target.default.args = {
      HOST_BASE_IMAGE: host.name,
      HOST_BASE_IMAGE_TAG: host.tag,
      BASE_IMAGE: base.name,
      BASE_IMAGE_TAG: base.tag,
      MIMIC_ARCH: targetArch,
    };
    if (options.push) {
      bakeJson.target.default.output = ["type=registry"];
    }
    bakeJson.target.default.tags = [`${output.name}-${targetArch}:${output.tag}`];
    console.log(bakeJson);
    await $.path("bake.json").writeJson(bakeJson);
    await $`docker buildx bake -f bake.json`;
    if (options.host) {
      bakeJson.target.default.target = internalHost;
      bakeJson.target.default.tags = [`${output.name}-${targetArch}-host:${output.tag}`];
      await $.path("bake.json").writeJson(bakeJson);
      await $`docker buildx bake -f bake.json`;
    }
  })
  .parse(Deno.args);