import { logger } from "../src/log.ts";
import { builtinRecipes } from "./builtin/recipes.ts";
import builtinPackageData from "./builtin/supported.json" with {
  type: "json",
};
import { customRecipes } from "/etc/mimic-cross/custom/recipes.ts";
import customPackageData from "/etc/mimic-cross/custom/supported.json" with {
  type: "json",
};

const supportedPackages: Record<string, PackageInfo> = {
  ...builtinPackageData,
  ...customPackageData,
};

export interface PackageInfo {
  recipe?: string;
  isCrossTool?: boolean;
  blockList?: string[];
}

export interface PackageRecipe {
  nameResolver?(name: string, info: PackageInfo): string[];
  postInstall?(name: string, info: PackageInfo): Promise<void>;
}

export const recipes = (() => {
  const recipes: Map<string, PackageRecipe> = new Map();
  builtinRecipes(recipes);
  customRecipes(recipes);
  console.log(recipes);
  return recipes;
})();

function getRecipe(name: string, info: PackageInfo): PackageRecipe {
  const recipeName = info.recipe ?? "default";
  const recipe = recipes.get(recipeName);
  if (recipe) return recipe;
  throw new Error(`Can't find ${name}.recipe = ${recipeName}`);
}

export function getSupportedPackagesFrom(packages: string[]): string[] {
  const filteredPackages: string[] = [];
  for (const p of packages) {
    if (!(p in supportedPackages)) continue;
    const recipe = getRecipe(p, supportedPackages[p]);
    if (recipe.nameResolver) {
      filteredPackages.push(...recipe.nameResolver(p, supportedPackages[p]));
      continue;
    }
    filteredPackages.push(p);
  }
  return filteredPackages;
}

export async function callPostInstall(packages: string[]) {
  const promises = [];
  for (const p of packages) {
    const packageInfo = supportedPackages[p];
    if (packageInfo === undefined) {
      logger.error(
        `(callPostInstall) Unsuported package ${p} exists in packages.`,
      );
      throw new Error(`Package ${p} is not supported.`);
    }
    const recipe = getRecipe(p, packageInfo);
    if (recipe.postInstall) {
      logger.debug(`(deployPackages) call postInstall(${p})`);
      promises.push(recipe.postInstall(p, packageInfo));
    }
  }
  await Promise.all(promises);
}
