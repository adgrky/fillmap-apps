#!/usr/bin/env python3
"""
新アプリ雛形ジェネレーター
使い方: python tools/create_app.py <appId> <アプリ名>
例:     python tools/create_app.py prefmap 都道府県塗りつぶしマップ
"""

import sys
import os
import textwrap

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def write(path: str, content: str) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  created: {os.path.relpath(path, REPO_ROOT)}")


def generate(app_id: str, app_name: str) -> None:
    base = os.path.join(REPO_ROOT, "apps", app_id)
    if os.path.exists(base):
        print(f"エラー: apps/{app_id} は既に存在します。")
        sys.exit(1)

    src = os.path.join(base, "src")
    print(f"\n🏭 {app_name} ({app_id}) を生成します...\n")

    # package.json
    write(os.path.join(base, "package.json"), textwrap.dedent(f"""\
        {{
          "name": "{app_id}",
          "private": true,
          "version": "0.1.0",
          "type": "module",
          "scripts": {{
            "dev": "vite",
            "build": "tsc --noEmit && vite build",
            "typecheck": "tsc --noEmit",
            "preview": "vite preview"
          }},
          "dependencies": {{
            "@fillmap/core": "*",
            "maplibre-gl": "^4.7.1",
            "react": "^18.3.1",
            "react-dom": "^18.3.1",
            "zustand": "^4.5.5"
          }},
          "devDependencies": {{
            "@types/react": "^18.3.12",
            "@types/react-dom": "^18.3.1",
            "@vitejs/plugin-react": "^4.3.4",
            "autoprefixer": "^10.4.20",
            "postcss": "^8.4.49",
            "tailwindcss": "^3.4.17",
            "typescript": "^5.6.3",
            "vite": "^5.4.11",
            "vite-plugin-pwa": "^0.21.1"
          }}
        }}
    """))

    # vite.config.ts
    write(os.path.join(base, "vite.config.ts"), textwrap.dedent(f"""\
        import {{ defineConfig }} from "vite";
        import {{ fileURLToPath }} from "node:url";
        import react from "@vitejs/plugin-react";
        import {{ VitePWA }} from "vite-plugin-pwa";

        export default defineConfig({{
          base: "./",
          resolve: {{
            alias: {{
              "@fillmap/core/generic": fileURLToPath(new URL("../../packages/core/src/generic.ts", import.meta.url)),
              "@fillmap/core": fileURLToPath(new URL("../../packages/core/src/index.ts", import.meta.url)),
            }},
          }},
          plugins: [
            react(),
            VitePWA({{
              registerType: "autoUpdate",
              includeAssets: [],
              manifest: {{
                name: "{app_name}",
                short_name: "{app_id}",
                description: "{app_name}の説明をここに書く",
                theme_color: "#0b0e14",
                background_color: "#0b0e14",
                display: "standalone",
                start_url: "./",
                icons: [
                  {{ src: "icons/icon-192.png", sizes: "192x192", type: "image/png" }},
                  {{ src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }},
                ],
              }},
              workbox: {{
                globPatterns: ["**/*.{{js,css,html,ico,png,svg,woff2}}", "data/*.{{geojson,json}}"],
                maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
              }},
            }}),
          ],
        }});
    """))

    # tsconfig.json
    write(os.path.join(base, "tsconfig.json"), textwrap.dedent("""\
        {
          "extends": "../../tsconfig.base.json",
          "compilerOptions": {
            "baseUrl": ".",
            "paths": {
              "@fillmap/core/generic": ["../../packages/core/src/generic.ts"]
            }
          },
          "include": ["src"]
        }
    """))

    # tailwind.config.js
    write(os.path.join(base, "tailwind.config.js"), textwrap.dedent("""\
        /** @type {import('tailwindcss').Config} */
        export default {
          content: ["./index.html", "./src/**/*.{ts,tsx}"],
          theme: {
            extend: {
              colors: {
                bg: "#0b0e14",
                surface: "#151a23",
                "surface-2": "#1e2530",
                text: "#e8ecf4",
                "text-dim": "#8b93a3",
                gold: "#fbbf24",
                danger: "#f87171",
              },
              borderRadius: { token: "14px" },
            },
          },
          plugins: [],
        };
    """))

    # postcss.config.js
    write(os.path.join(base, "postcss.config.js"), textwrap.dedent("""\
        export default {
          plugins: {
            tailwindcss: {},
            autoprefixer: {},
          },
        };
    """))

    # index.html
    write(os.path.join(base, "index.html"), textwrap.dedent(f"""\
        <!doctype html>
        <html lang="ja">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=1.0, user-scalable=no" />
            <meta name="theme-color" content="#0b0e14" />
            <title>{app_name}</title>
          </head>
          <body>
            <div id="root"></div>
            <script type="module" src="/src/main.tsx"></script>
          </body>
        </html>
    """))

    # src/index.css
    write(os.path.join(src, "index.css"), textwrap.dedent("""\
        @tailwind base;
        @tailwind components;
        @tailwind utilities;

        :root {
          color-scheme: dark;
        }

        html,
        body,
        #root {
          height: 100%;
          margin: 0;
        }

        body {
          background: #0b0e14;
          color: #e8ecf4;
          font-family: -apple-system, "Hiragino Sans", "Noto Sans JP", sans-serif;
          -webkit-tap-highlight-color: transparent;
          overscroll-behavior: none;
        }
    """))

    # src/main.tsx
    write(os.path.join(src, "main.tsx"), textwrap.dedent("""\
        import { StrictMode } from "react";
        import { createRoot } from "react-dom/client";
        import "maplibre-gl/dist/maplibre-gl.css";
        import "./index.css";
        import { App } from "./app/App";
        import { initAnalytics } from "@fillmap/core";

        // PVのみの軽量計測(00_master §8-1)。サイトコード未設定時は何も送らない(プライバシー既定)。
        initAnalytics(import.meta.env.VITE_GOATCOUNTER_CODE as string | undefined);

        createRoot(document.getElementById("root")!).render(
          <StrictMode>
            <App />
          </StrictMode>
        );
    """))

    # src/vite-env.d.ts
    write(os.path.join(src, "vite-env.d.ts"), '/// <reference types="vite/client" />\n')

    # src/app/App.tsx (スタブ)
    write(os.path.join(src, "app", "App.tsx"), textwrap.dedent(f"""\
        // {app_name} ルート。SPEC に従い実装すること。
        export function App() {{
          return (
            <div className="flex h-full items-center justify-center bg-bg text-text">
              <p className="text-xl font-bold">{app_name}</p>
            </div>
          );
        }}
    """))

    # src/domain/ プレースホルダー
    write(os.path.join(src, "domain", ".gitkeep"), "")

    # public/icons/ プレースホルダー
    write(os.path.join(base, "public", "icons", ".gitkeep"), "")

    # public/data/ プレースホルダー
    write(os.path.join(base, "public", "data", ".gitkeep"), "")

    # docs/SPEC.md スタブ
    write(os.path.join(base, "docs", "SPEC.md"), textwrap.dedent(f"""\
        # {app_name} SPEC

        ## §1 概要
        (ここに説明を書く)

        ## §2 データ
        - データソース:
        - フォーマット:

        ## §3 塗り状態
        - レベル定義:

        ## §4 保存
        - storageKey: `{app_id}.v1`
        - version: 1

        ## §5 画面構成
        - タブ:

        ## §6 デザイントークン
        - アクセントカラー:

        ## §7 スコア / 演出

        ## §8 達成率

        ## §9 称号

        ## §10 シェア画像
    """))

    # docs/PROGRESS.md
    write(os.path.join(base, "docs", "PROGRESS.md"), textwrap.dedent(f"""\
        ## 初期生成
        - 完了: create_app.py で雛形生成
        - 決定: -
        - 残課題: SPEC.md 記入・データ準備・App.tsx 本実装
    """))

    print(textwrap.dedent(f"""
        ✅ apps/{app_id}/ を生成しました。

        次のステップ:
        1. docs/SPEC.md を埋める
        2. public/data/ にデータを置く
        3. src/domain/ に types.ts / store.ts / persistence.ts を実装
        4. src/app/App.tsx を本実装
        5. tools/gen_{app_id}_icons.py でPWAアイコン生成
        6. npm install (workspace)
        7. vite dev でプレビュー確認
    """))


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("使い方: python tools/create_app.py <appId> <アプリ名>")
        sys.exit(1)
    generate(sys.argv[1], sys.argv[2])
