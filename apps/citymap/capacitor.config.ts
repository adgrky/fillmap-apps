import type { CapacitorConfig } from "@capacitor/cli";

// SPEC §14.1。Web 資産(dist/)をネイティブシェルに包む。
const config: CapacitorConfig = {
  appId: "com.adgrky.citymap",
  appName: "市区町村ぬりつぶし",
  webDir: "dist",
};

export default config;
