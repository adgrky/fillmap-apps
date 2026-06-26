#!/usr/bin/env python3
"""
100名城キュレーション: 日本百選DBを curated/castles.csv に正規化。

出典(SPEC §E6/§E7):
  日本百選と座標値 https://100sen.cyber-ninja.jp/ (csv/shiro02.csv, 十進数・自由使用可)
  選定: 公益財団法人日本城郭協会「日本100名城」(2006年発表)。
  名称・座標・所在地は事実データ(著作権対象外)。100名城のみ抽出。

入力 : tools/raw/shiro02.csv (cp932, 列: No,名称,北緯,東経,所在地)
出力 : tools/curated/castles.csv (utf-8, 列: id,name,lat,lng,pref,tags)
"""

import csv
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "tools", "raw", "shiro02.csv")
OUT = os.path.join(ROOT, "tools", "curated", "castles.csv")

# 現存12天守・国宝5城(名称で照合。事実データ)
GENZON12 = {"弘前城", "松本城", "丸岡城", "犬山城", "彦根城", "姫路城", "松江城", "備中松山城", "丸亀城", "松山城", "宇和島城", "高知城"}
KOKUHO5 = {"松本城", "犬山城", "彦根城", "姫路城", "松江城"}

HEADER_COMMENT = [
    "# 日本100名城 — 本アプリ用キュレーションデータ",
    "# 出典: 日本百選と座標値 https://100sen.cyber-ninja.jp/ (csv/shiro02.csv)",
    "# 選定: 公益財団法人日本城郭協会「日本100名城」(2006)。名称・座標・所在地は事実データ。",
]


def main_name(raw: str) -> str:
    """『主名（別名）』→ 主名。 """
    m = re.match(r"^(.+?)（.+?）$", raw.strip())
    return m.group(1).strip() if m else raw.strip()


def first_pref(locality: str) -> str:
    m = re.match(r"(.+?[都道府県])", locality.strip())
    return m.group(1) if m else locality.strip()


def main() -> None:
    with open(RAW, encoding="cp932", newline="") as f:
        rows = [r for r in csv.reader(f) if r and r[0].strip().isdigit()]

    out_rows = []
    for r in rows:
        no = int(r[0])
        name = main_name(r[1])
        lat, lng = float(r[2]), float(r[3])
        pref = first_pref(r[4])
        tags = ["100名城"]
        if name in GENZON12:
            tags.append("現存12天守")
        if name in KOKUHO5:
            tags.append("国宝")
        out_rows.append([f"shiro_{no:03d}", name, f"{lat:.6f}", f"{lng:.6f}", pref, "|".join(tags)])

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8", newline="") as f:
        for c in HEADER_COMMENT:
            f.write(c + "\n")
        w = csv.writer(f)
        w.writerow(["id", "name", "lat", "lng", "pref", "tags"])
        w.writerows(out_rows)

    g = sum(1 for r in out_rows if "現存12天守" in r[5])
    k = sum(1 for r in out_rows if "国宝" in r[5])
    print(f"✅ {len(out_rows)} 城 → {os.path.relpath(OUT, ROOT)}")
    print(f"   現存12天守: {g} / 国宝: {k} / 都道府県数: {len(set(r[4] for r in out_rows))}")


if __name__ == "__main__":
    main()
