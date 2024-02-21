export interface PackageInfo {
  postInstall?: string;
  isCrossTool?: boolean;
  blockList?: string[];
}
