import type { CapacitorConfig } from "@capacitor/cli";

// SPEC §14.1。Web 資産(dist/)をネイティブシェルに包む。
const config: CapacitorConfig = {
  appId: "com.adgrky.michimap",
  appName: "道の駅埋め立てマップ",
  webDir: "dist",
};

export default config;
