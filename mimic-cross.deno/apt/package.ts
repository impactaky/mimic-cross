import $ from "daxex/mod.ts";
import { builtinRecipes } from "./packages/recipes.ts";

export interface PackageInfo {
  recipe?: string;
  isCrossTool?: boolean;
  blockList?: string[];
}

export interface PackageRecipe {
  nameResolver?(name: string, info: PackageInfo): string[];
  postInstall?(name: string, info: PackageInfo): Promise<void>;
}

export const supportedPackagesPromise = (async () => {
  // Read default packages/supported.json
  const supportedPackages = await $.path(import.meta.url).parent()?.join(
    "packages",
    "supported.json",
  ).readJson<Record<string, PackageInfo>>();
  if (supportedPackages === undefined) {
    throw new Error("Can't read supported.json");
  }
  // Read user packages/supported.json
  return supportedPackages;
})();

export const recipes = (() => {
  const recipes: Map<string, PackageRecipe> = new Map();
  builtinRecipes(recipes);
  return recipes;
})();

export function getRecipe(info: PackageInfo): PackageRecipe {
  const recipe = recipes.get(info.recipe ?? "default");
  if (recipe) return recipe;
  throw new Error(`Can't find recipe ${recipe}`);
}
