import { builtinRecipes } from "./builtin/recipes.ts";
import { logger } from "../src/log.ts";
import builtinPackagesData from "./builtin/supported.json" with {
  type: "json",
};

try {
  await import("/etc/mimic-cross/custom/recipes.ts");
} catch (error) {
  if (error.code !== "ERR_MODULE_NOT_FOUND") throw error;
}

let customPackageData = {};
try {
  customPackageData = await import("/etc/mimic-cross/custom/supported.json", {
    with: { type: "json" },
  });
} catch (error) {
  if (error.code !== "ERR_MODULE_NOT_FOUND") throw error;
}
const supportedPackages: Record<string, PackageInfo> = {
  ...builtinPackagesData,
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

const recipes = (() => {
  const recipes: Map<string, PackageRecipe> = new Map();
  builtinRecipes(recipes);
  return recipes;
})();

function getRecipe(info: PackageInfo): PackageRecipe {
  const recipe = recipes.get(info.recipe ?? "default");
  if (recipe) return recipe;
  throw new Error(`Can't find recipe ${recipe}`);
}

export function getSupportedPackagesFrom(packages: string[]): string[] {
  const filteredPackages: string[] = [];
  for (const p of packages) {
    if (!(p in supportedPackages)) continue;
    const recipe = getRecipe(supportedPackages[p]);
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
    const recipe = getRecipe(packageInfo);
    if (recipe.postInstall) {
      logger.debug(`(deployPackages) call postInstall(${p})`);
      promises.push(recipe.postInstall(p, packageInfo));
    }
  }
  await Promise.all(promises);
}
