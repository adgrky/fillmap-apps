#!/usr/bin/env python3
"""
温泉キュレーション: 日本百選DB(百名湯)を curated/onsen.csv に正規化。

出典(SPEC §E6/§E7):
  日本百選と座標値 https://100sen.cyber-ninja.jp/ (csv/onsen02.csv, 十進数・自由使用可)
  選定: 松田忠徳『日本百名湯』(温泉教授選定)。温泉名・座標・所在地は事実データ。

入力 : tools/raw/onsen02.csv (cp932, 列: No,温泉名,北緯,東経,所在地)
出力 : tools/curated/onsen.csv (utf-8, 列: id,name,lat,lng,pref)
"""

import csv
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "tools", "raw", "onsen02.csv")
OUT = os.path.join(ROOT, "tools", "curated", "onsen.csv")

HEADER_COMMENT = [
    "# 日本百名湯 — 本アプリ用キュレーションデータ",
    "# 出典: 日本百選と座標値 https://100sen.cyber-ninja.jp/ (csv/onsen02.csv)",
    "# 選定: 松田忠徳『日本百名湯』。温泉名・座標・所在地は事実データ(著作権対象外)。",
]


def first_pref(locality: str) -> str:
    m = re.match(r"(.+?[都道府県])", locality.strip())
    return m.group(1) if m else locality.strip()


def main() -> None:
    with open(RAW, encoding="cp932", newline="") as f:
        rows = [r for r in csv.reader(f) if r and r[0].strip().isdigit()]
    out_rows = []
    for r in rows:
        no = int(r[0])
        out_rows.append([f"onsen_{no:03d}", r[1].strip(), f"{float(r[2]):.6f}", f"{float(r[3]):.6f}", first_pref(r[4])])
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8", newline="") as f:
        for c in HEADER_COMMENT:
            f.write(c + "\n")
        w = csv.writer(f)
        w.writerow(["id", "name", "lat", "lng", "pref"])
        w.writerows(out_rows)
    print(f"✅ {len(out_rows)} 湯 → {os.path.relpath(OUT, ROOT)} / 都道府県数: {len(set(r[4] for r in out_rows))}")


if __name__ == "__main__":
    main()
