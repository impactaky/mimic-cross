import $ from "daxex/mod.ts";
import { PackageRecipe } from "mimic-cross/apt/package.ts";

export function customRecipes(recipes: Map<string, PackageRecipe>) {
  recipes.set("mimic-custom-recipe", {
    postInstall: async (name, _info) => {
      const testPath = await Deno.env.get("MIMIC_TEST_DATA_PATH");
      if (testPath) {
        await $.path(testPath).join("custom_recipe").writeText(name);
      }
    },
  });
}
