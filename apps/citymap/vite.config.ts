import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "./",
  resolve: {
    alias: {
      "@fillmap/core/generic": fileURLToPath(new URL("../../packages/core/src/generic.ts", import.meta.url)),
    },
  },
  plugins: [
    react(),
    VitePWA({
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
        icons: [],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}", "data/*.{geojson,json}"],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
      },
    }),
  ],
});
