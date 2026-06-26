#!/usr/bin/env python3
"""既存アプリに Capacitor ストア化レールを後付けする冪等スクリプト(SPEC §14.7 / STORE_PIPELINE.md)。

使い方:
    python3 tools/add_capacitor.py <appId> "<アプリ名>" <packageId>
例:
    python3 tools/add_capacitor.py citymap "市区町村ぬりつぶし" com.adgrky.citymap

生成可能な定型のみ行う(何度実行しても安全)。vite.config の CAP_BUILD 分岐と
AndroidManifest の AdMob アプリID は壊さないため手動(末尾の案内 / STORE_PIPELINE.md)。
"""
import json
import sys
from pathlib import Path


def main() -> None:
    if len(sys.argv) != 4:
        print(__doc__)
        sys.exit(1)
    app_id, app_name, pkg = sys.argv[1], sys.argv[2], sys.argv[3]
    root = Path(__file__).resolve().parent.parent
    app_dir = root / "apps" / app_id
    if not app_dir.is_dir():
        print(f"[error] apps/{app_id} が見つかりません")
        sys.exit(1)

    # 1) capacitor.config.ts
    cfg = app_dir / "capacitor.config.ts"
    if not cfg.exists():
        cfg.write_text(
            'import type { CapacitorConfig } from "@capacitor/cli";\n\n'
            "// SPEC §14.1。Web 資産(dist/)をネイティブシェルに包む。\n"
            "const config: CapacitorConfig = {\n"
            f'  appId: "{pkg}",\n'
            f'  appName: "{app_name}",\n'
            '  webDir: "dist",\n'
            "};\n\nexport default config;\n",
            encoding="utf-8",
        )
        print(f"[created] {cfg.relative_to(root)}")
    else:
        print(f"[skip]    {cfg.relative_to(root)} は既存")

    # 2) package.json に scripts を冪等マージ
    pkg_json = app_dir / "package.json"
    data = json.loads(pkg_json.read_text(encoding="utf-8"))
    scripts = data.setdefault("scripts", {})
    add = {
        "build:app": "tsc --noEmit && CAP_BUILD=1 vite build",
        "cap:sync": "npm run build:app && cap sync android",
        "cap:open": "cap open android",
        "cap:run": "npm run build:app && cap sync android && cap run android",
    }
    changed = False
    for k, v in add.items():
        if scripts.get(k) != v:
            scripts[k] = v
            changed = True
    if changed:
        pkg_json.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"[updated] {pkg_json.relative_to(root)} (scripts)")
    else:
        print(f"[skip]    {pkg_json.relative_to(root)} (scripts) は最新")

    # 3) .gitignore 追記(冪等)
    gi = app_dir / ".gitignore"
    block = (
        "# Capacitor / Android ネイティブ生成物・秘匿情報(SPEC §14.6)\n"
        "/android/.gradle\n/android/build\n/android/app/build\n/android/captures\n"
        "/android/local.properties\n/android/.idea\n/android/app/release\n"
        "*.keystore\n*.jks\nkey.properties\n"
    )
    existing = gi.read_text(encoding="utf-8") if gi.exists() else ""
    if "Capacitor / Android" not in existing:
        sep = "\n" if existing and not existing.endswith("\n") else ""
        gi.write_text(existing + sep + block, encoding="utf-8")
        print(f"[updated] {gi.relative_to(root)}")
    else:
        print(f"[skip]    {gi.relative_to(root)} は既存")

    # 4) .env.example 追記(冪等)
    env = app_dir / ".env.example"
    env_block = (
        "\n# --- Capacitor アプリ版(native)用。広告/課金(SPEC §14) ---\n"
        "VITE_ADMOB_BANNER=\n"
        "VITE_ADMOB_TEST=1\n"
        f"VITE_IAP_PRODUCT_ID={app_id}.premium\n"
    )
    existing_env = env.read_text(encoding="utf-8") if env.exists() else ""
    if "VITE_ADMOB_BANNER" not in existing_env:
        env.write_text(existing_env + env_block, encoding="utf-8")
        print(f"[updated] {env.relative_to(root)}")
    else:
        print(f"[skip]    {env.relative_to(root)} は既存")

    print("\n[次の手動ステップ(STORE_PIPELINE.md §1-2)]")
    print(f"  1. npm install -w {app_id} @capacitor/core@latest @capacitor/cli@latest @capacitor/android@latest")
    print(f"     npm install -w {app_id} @capacitor-community/admob@latest cordova-plugin-purchase@latest")
    print("  2. vite.config.ts に CAP_BUILD 分岐(base / PWA無効化)を追加(railmap を参照)")
    print(f"  3. cd apps/{app_id} && npm run build:app && npx cap add android")
    print("  4. android/app/src/main/AndroidManifest.xml に AdMob アプリID(meta-data)を直書き")
    print("  ※ ビルドは JDK 21 必須: JAVA_HOME=\"/Applications/Android Studio.app/Contents/jbr/Contents/Home\"")


if __name__ == "__main__":
    main()
