#!/usr/bin/env python3
"""
モノレポの1アプリを GitHub Pages 公開用 standalone リポジトリへ複製する。
citymap standalone と同一構成: @fillmap/core/generic を src/core/ にインライン化し
workspace 依存を解消、Pages デプロイ workflow を付与する。

使い方: python tools/export_standalone.py <app_id>
出力:   ~/Desktop/クロード/<app_id>/  (既存なら中断)
"""

import os
import re
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DESKTOP = os.path.dirname(ROOT)  # ~/Desktop/クロード

PKG_TEMPLATE = """{{
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
"""

TSCONFIG = """{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@fillmap/core/generic": ["./src/core/generic.ts"]
    }
  },
  "include": ["src"]
}
"""

DEPLOY_YML = """name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
"""

GITIGNORE = "node_modules/\ndist/\n.env\n.DS_Store\n*.log\n"

ENV_EXAMPLE = """# 広告(Google AdSense)。サイト公開・審査通過後に実IDを記入。未設定なら広告は非表示。
VITE_ADSENSE_CLIENT=
VITE_ADSENSE_SLOT=

# 広告除外(買い切り課金)。Stripe決済リンクのURL。
VITE_STRIPE_PAYMENT_LINK=

# 解除コードの SHA-256 ハッシュ(コード本体はソースに含めない)。
# 生成例: echo -n "実際のコード" | shasum -a 256
VITE_UNLOCK_CODE_HASH=
"""


def write(path: str, content: str) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)


def main() -> None:
    if len(sys.argv) != 2:
        print("使い方: python tools/export_standalone.py <app_id>")
        sys.exit(1)
    app_id = sys.argv[1]
    src_app = os.path.join(ROOT, "apps", app_id)
    dest = os.path.join(DESKTOP, app_id)
    if not os.path.isdir(src_app):
        sys.exit(f"エラー: apps/{app_id} が無い")
    if os.path.exists(os.path.join(dest, ".git")):
        sys.exit(f"エラー: {dest} は既に git 管理下。手動確認のこと")

    # src / public / 設定ファイルを複製(再実行で上書き)
    shutil.copytree(os.path.join(src_app, "src"), os.path.join(dest, "src"), dirs_exist_ok=True)
    shutil.copytree(os.path.join(src_app, "public"), os.path.join(dest, "public"), dirs_exist_ok=True)
    for f in ("index.html", "tailwind.config.js", "postcss.config.js"):
        sp = os.path.join(src_app, f)
        if os.path.exists(sp):
            shutil.copy(sp, os.path.join(dest, f))

    # core を src/core/ にインライン化
    os.makedirs(os.path.join(dest, "src", "core"), exist_ok=True)
    shutil.copy(
        os.path.join(ROOT, "packages", "core", "src", "generic.ts"),
        os.path.join(dest, "src", "core", "generic.ts"),
    )

    # vite.config: alias を ./src/core に書き換え、barrel(@fillmap/core)行を除去
    vc = open(os.path.join(src_app, "vite.config.ts"), encoding="utf-8").read()
    vc = vc.replace("../../packages/core/src/generic.ts", "./src/core/generic.ts")
    vc = re.sub(
        r'\n\s*"@fillmap/core": fileURLToPath\(new URL\("\.\./\.\./packages/core/src/index\.ts", import\.meta\.url\)\),',
        "",
        vc,
    )
    write(os.path.join(dest, "vite.config.ts"), vc)

    # 各種設定ファイル生成
    write(os.path.join(dest, "package.json"), PKG_TEMPLATE.format(app_id=app_id))
    write(os.path.join(dest, "tsconfig.json"), TSCONFIG)
    write(os.path.join(dest, ".github", "workflows", "deploy.yml"), DEPLOY_YML)
    write(os.path.join(dest, ".gitignore"), GITIGNORE)
    write(os.path.join(dest, ".env.example"), ENV_EXAMPLE)
    # docs も持っていく(SPEC/PROGRESS)
    if os.path.isdir(os.path.join(src_app, "docs")):
        shutil.copytree(os.path.join(src_app, "docs"), os.path.join(dest, "docs"), dirs_exist_ok=True)

    print(f"✅ standalone 複製完了: {dest}")
    print(f"   次: cd {dest} && npm install && npm run build で検証 → git init → gh repo create")


if __name__ == "__main__":
    main()
