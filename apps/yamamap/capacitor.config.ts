import type { CapacitorConfig } from "@capacitor/cli";

// SPEC §14.1。Web 資産(dist/)をネイティブシェルに包む。
const config: CapacitorConfig = {
  appId: "com.adgrky.yamamap",
  appName: "百名山埋め立てマップ",
  webDir: "dist",
};

export default config;
