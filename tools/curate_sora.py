#!/usr/bin/env python3
"""
空港・離島キュレーション → curated/sora.csv(layer列で2レイヤー)。

出典(SPEC §E6/§E7):
  空港: OpenStreetMap(aeroway=aerodrome かつ IATAコード付き)© OpenStreetMap contributors(ODbL)。
  離島: 主要な有人離島を一次情報(国土地理院地形図・各自治体)で照合し手キュレーション。
        ※有人離島の網羅(約400島)はv2。v1は代表的な有人島のみ。

入力 : tools/raw/osm/airports.json (Overpass out center tags)
出力 : tools/curated/sora.csv (utf-8, 列: id,name,lat,lng,pref,layer)
"""

import csv
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AIRPORTS = os.path.join(ROOT, "tools", "raw", "osm", "airports.json")
OUT = os.path.join(ROOT, "tools", "curated", "sora.csv")

HEADER_COMMENT = [
    "# 空港・離島 — 本アプリ用キュレーションデータ(layer: airport / island)",
    "# 空港: OpenStreetMap aeroway=aerodrome + iata © OpenStreetMap contributors(ODbL)",
    "# 離島: 主要有人離島を地理院地図で照合し手キュレーション(網羅はv2)。",
]

# 主要有人離島(name, lat, lng, pref)。座標は島の代表点。
ISLANDS = [
    ("利尻島", 45.18, 141.23, "北海道"), ("礼文島", 45.30, 141.04, "北海道"), ("奥尻島", 42.17, 139.51, "北海道"),
    ("佐渡島", 38.02, 138.37, "新潟県"), ("粟島", 38.46, 139.25, "新潟県"),
    ("伊豆大島", 34.75, 139.38, "東京都"), ("八丈島", 33.11, 139.80, "東京都"), ("三宅島", 34.08, 139.53, "東京都"),
    ("新島", 34.37, 139.27, "東京都"), ("神津島", 34.20, 139.15, "東京都"),
    ("父島", 27.09, 142.19, "東京都"), ("母島", 26.63, 142.16, "東京都"),
    ("淡路島", 34.36, 134.83, "兵庫県"), ("小豆島", 34.48, 134.25, "香川県"), ("直島", 34.46, 133.99, "香川県"),
    ("隠岐島後", 36.20, 133.32, "島根県"), ("中ノ島", 36.10, 133.10, "島根県"),
    ("大三島", 34.25, 133.00, "愛媛県"), ("因島", 34.30, 133.18, "広島県"), ("周防大島", 33.92, 132.25, "山口県"),
    ("対馬", 34.30, 129.30, "長崎県"), ("壱岐島", 33.78, 129.72, "長崎県"),
    ("福江島", 32.70, 128.84, "長崎県"), ("中通島", 32.98, 129.07, "長崎県"), ("平戸島", 33.36, 129.55, "長崎県"),
    ("天草下島", 32.40, 130.10, "熊本県"),
    ("種子島", 30.62, 130.97, "鹿児島県"), ("屋久島", 30.34, 130.51, "鹿児島県"), ("奄美大島", 28.32, 129.37, "鹿児島県"),
    ("徳之島", 27.78, 128.96, "鹿児島県"), ("沖永良部島", 27.37, 128.57, "鹿児島県"), ("与論島", 27.04, 128.41, "鹿児島県"),
    ("喜界島", 28.32, 129.94, "鹿児島県"),
    ("石垣島", 24.40, 124.16, "沖縄県"), ("宮古島", 24.80, 125.30, "沖縄県"), ("西表島", 24.36, 123.80, "沖縄県"),
    ("与那国島", 24.47, 123.00, "沖縄県"), ("久米島", 26.34, 126.80, "沖縄県"), ("伊江島", 26.72, 127.79, "沖縄県"),
    ("渡嘉敷島", 26.20, 127.36, "沖縄県"), ("座間味島", 26.23, 127.30, "沖縄県"), ("波照間島", 24.06, 123.78, "沖縄県"),
    ("多良間島", 24.66, 124.70, "沖縄県"), ("南大東島", 25.84, 131.23, "沖縄県"), ("北大東島", 25.94, 131.30, "沖縄県"),
]


def main() -> None:
    rows = []

    # 空港(OSM)
    data = json.load(open(AIRPORTS, encoding="utf-8"))
    seen = set()
    n = 0
    for e in data.get("elements", []):
        t = e.get("tags", {})
        name = t.get("name")
        iata = t.get("iata")
        if not name or not iata or iata in seen:
            continue
        seen.add(iata)
        if "center" in e:
            lat, lng = e["center"]["lat"], e["center"]["lon"]
        elif "lat" in e:
            lat, lng = e["lat"], e["lon"]
        else:
            continue
        n += 1
        rows.append([f"air_{n:03d}", name, f"{lat:.6f}", f"{lng:.6f}", "", "airport"])

    # 離島(手キュレーション)
    for i, (name, lat, lng, pref) in enumerate(ISLANDS, 1):
        rows.append([f"isl_{i:03d}", name, f"{lat:.6f}", f"{lng:.6f}", pref, "island"])

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8", newline="") as f:
        for c in HEADER_COMMENT:
            f.write(c + "\n")
        w = csv.writer(f)
        w.writerow(["id", "name", "lat", "lng", "pref", "layer"])
        w.writerows(rows)

    air = sum(1 for r in rows if r[5] == "airport")
    isl = sum(1 for r in rows if r[5] == "island")
    oki = sum(1 for r in rows if r[5] == "island" and r[4] == "沖縄県")
    print(f"✅ 空港 {air} + 離島 {isl}(沖縄 {oki}) = {len(rows)} → {os.path.relpath(OUT, ROOT)}")


if __name__ == "__main__":
    main()
