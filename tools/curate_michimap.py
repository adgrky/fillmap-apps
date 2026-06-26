#!/usr/bin/env python3
"""
道の駅キュレーション: 国土数値情報P35を curated/roadside_stations.csv に正規化。

出典(SPEC §E6/§E7 著作権監査用):
  国土交通省 国土数値情報「道の駅」データ P35-18(2018年度版・世界測地系)
  https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-P35.html
  駅名・所在地・座標は事実データ(著作権対象外)。施設フラグ等の付帯属性は収載しない。
  ※年1回程度の新規登録への追従は手動更新で許容(基準年=2018, VERIFIED.md記載)。

入力 : tools/raw/p35/P35-18_GML/P35-18_Roadside_Station.geojson
出力 : tools/curated/roadside_stations.csv (utf-8, 列: id,name,lat,lng,pref)

P35属性: P35_001=緯度 / P35_002=経度 / P35_003=都道府県名 / P35_006=道の駅名
"""

import csv
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "tools", "raw", "p35", "P35-18_GML", "P35-18_Roadside_Station.geojson")
OUT = os.path.join(ROOT, "tools", "curated", "roadside_stations.csv")

HEADER_COMMENT = [
    "# 道の駅 全国一覧 — 本アプリ用キュレーションデータ",
    "# 出典: 国土数値情報「道の駅」P35-18(2018年度版) 国土交通省",
    "#       https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-P35.html",
    "# 駅名・所在地・座標は事実データ(著作権対象外)。施設フラグ等の付帯属性は非収載(SPEC §E7)。",
]


def main() -> None:
    fc = json.load(open(SRC, encoding="utf-8"))
    rows = []
    for i, f in enumerate(sorted(fc["features"], key=lambda x: x["properties"]["P35_005"]), 1):
        p = f["properties"]
        lat = float(p["P35_001"])
        lng = float(p["P35_002"])
        rows.append([f"michi_{i:04d}", p["P35_006"], f"{lat:.6f}", f"{lng:.6f}", p["P35_003"]])

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8", newline="") as fp:
        for c in HEADER_COMMENT:
            fp.write(c + "\n")
        w = csv.writer(fp)
        w.writerow(["id", "name", "lat", "lng", "pref"])
        w.writerows(rows)

    print(f"✅ {len(rows)} 駅 → {os.path.relpath(OUT, ROOT)}")
    print(f"   都道府県数: {len(set(r[4] for r in rows))}")


if __name__ == "__main__":
    main()
