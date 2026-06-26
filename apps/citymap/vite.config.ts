import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// CAP_BUILD=1 のとき = Capacitor(ネイティブアプリ)向けビルド(SPEC §14.2, railmap同様)。
// ネイティブは localhost ルート配信なので base="/"、かつ PWA(Service Worker)を無効化する。
const isCap = process.env.CAP_BUILD === "1";

export default defineConfig({
  base: isCap ? "/" : "./",
  resolve: {
    alias: {
      "@fillmap/core/generic": fileURLToPath(new URL("../../packages/core/src/generic.ts", import.meta.url)),
      "@fillmap/core": fileURLToPath(new URL("../../packages/core/src/index.ts", import.meta.url)),
    },
  },
  plugins: [
    react(),
    ...(isCap ? [] : [VitePWA({
      registerType: "autoUpdate",
      includeAssets: [],
      manifest: {
        name: "市区町村塗りつぶしマップ",
        short_name: "citymap",
        description: "行った市区町村を塗って、人生の行動範囲を一枚の絵にする",
        theme_color: "#0b0e14",
        background_color: "#0b0e14",
        display: "standalone",
        start_url: "./",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}", "data/*.{geojson,json}"],
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
      },
    })]),
  ],
});
