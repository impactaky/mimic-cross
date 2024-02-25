export interface PackageInfo {
  postInstall?: string;
  isCrossTool?: boolean;
  blockList?: string[];
}

export interface PackageRecipe {
  nameResolver?(name: string, info: PackageInfo): string[];
  postInstall?(name: string, info: PackageInfo): Promise<void>;
}
