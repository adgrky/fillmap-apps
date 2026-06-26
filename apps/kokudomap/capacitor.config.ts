import type { CapacitorConfig } from "@capacitor/cli";

// SPEC §14.1。Web 資産(dist/)をネイティブシェルに包む。
const config: CapacitorConfig = {
  appId: "com.adgrky.kokudomap",
  appName: "国道完全制覇マップ",
  webDir: "dist",
};

export default config;
