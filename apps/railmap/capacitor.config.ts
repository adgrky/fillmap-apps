import type { CapacitorConfig } from "@capacitor/cli";

// SPEC §14.1。Web 資産(dist/)をネイティブシェルに包む。
// 署名は android/ の gradle(key.properties)側で行う。
const config: CapacitorConfig = {
  appId: "com.adgrky.railmap",
  appName: "塗り鉄",
  webDir: "dist",
};

export default config;
