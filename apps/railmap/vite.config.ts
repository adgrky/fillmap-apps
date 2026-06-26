import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// CAP_BUILD=1 のとき = Capacitor(ネイティブアプリ)向けビルド(SPEC §14.2)。
// ネイティブは localhost ルート配信なので base="/"、かつ PWA(Service Worker)を無効化する
// (WebView 内 SW が AdMob/課金と干渉する既知問題の回避)。
// 未設定のとき = Web版(GitHub Pages)。base は相対 "./"、PWA 有効。
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
      // PNG/SVG/ICO は workbox の globPatterns で取得するため includeAssets は空
      includeAssets: [],
      manifest: {
        name: "塗り鉄 - 全国鉄道乗りつぶしマップ",
        short_name: "塗り鉄",
        description: "乗った路線が光る！日本全国の鉄道路線を塗りつぶす乗りつぶしマップ",
        theme_color: "#0b0e14",
        background_color: "#0b0e14",
        display: "standalone",
        start_url: "./",
        icons: [
          { src: "pwa-64x64.png",          sizes: "64x64",   type: "image/png" },
          { src: "pwa-192x192.png",         sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png",         sizes: "512x512", type: "image/png" },
          { src: "maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // data/*.geojson (路線/駅データ) をオフライン用にプレキャッシュ
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}", "data/*.{geojson,json}"],
        // lines.geojson は非圧縮 6MB 超のため制限を 10MB に引き上げ(gzip 後は ~0.5MB)
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
      },
    })]),
  ],
});
