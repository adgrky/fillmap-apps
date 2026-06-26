#!/usr/bin/env python3
"""
汎用 POINT 前処理(SPEC §E2/§E6)。
curated CSV を地点 GeoJSON + meta.json に変換する。POINT系アプリ共通(山/道の駅/城/温泉…)。

使い方:
  python tools/preprocess_point.py <curated_csv> <app_id>
  例:  python tools/preprocess_point.py tools/curated/mountains.csv yamamap

入力 CSV(先頭の # 行はコメントとしてスキップ):
  必須列: id,name,lat,lng,pref
  任意列: altitude, tags(| 区切り), その他任意属性 → properties にそのまま載せる

出力:
  apps/<app_id>/public/data/points.geojson  … FeatureCollection(Point)
  apps/<app_id>/public/data/meta.json       … { points: {id:{name,pref,...}}, totals:{pointCount,byPref} }
"""

import csv
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# GeoJSON / meta に固有列として展開する数値属性(存在すれば数値化)
NUMERIC_ATTRS = {"altitude"}


def read_rows(csv_path: str) -> list[dict]:
    with open(csv_path, encoding="utf-8", newline="") as f:
        lines = [ln for ln in f if not ln.lstrip().startswith("#")]
    reader = csv.DictReader(lines)
    return [r for r in reader if r.get("id")]


def to_props(row: dict) -> dict:
    props: dict = {"id": row["id"], "name": row["name"], "pref": row["pref"]}
    if row.get("altitude"):
        props["altitude"] = int(row["altitude"])
    if row.get("tags"):
        props["tags"] = [t for t in row["tags"].split("|") if t]
    # 上記以外の任意列も素直に載せる(空は除く)
    for k, v in row.items():
        if k in ("id", "name", "pref", "lat", "lng", "altitude", "tags"):
            continue
        if v not in (None, ""):
            props[k] = v
    return props


def main() -> None:
    if len(sys.argv) != 3:
        print("使い方: python tools/preprocess_point.py <curated_csv> <app_id>")
        sys.exit(1)
    csv_path = sys.argv[1] if os.path.isabs(sys.argv[1]) else os.path.join(ROOT, sys.argv[1])
    app_id = sys.argv[2]

    rows = read_rows(csv_path)

    features = []
    points_meta: dict = {}
    by_pref: dict = {}
    for row in rows:
        props = to_props(row)
        lng, lat = float(row["lng"]), float(row["lat"])
        # 簡易サニティチェック: 日本域に概ね収まるか(明らかな桁誤り検出)
        if not (122 <= lng <= 154 and 20 <= lat <= 46):
            print(f"  ⚠️ 範囲外座標: {props['id']} {props['name']} ({lat},{lng})")
        features.append({
            "type": "Feature",
            "id": props["id"],
            "properties": props,
            "geometry": {"type": "Point", "coordinates": [round(lng, 6), round(lat, 6)]},
        })
        meta_entry = {"name": props["name"], "pref": props["pref"]}
        if "altitude" in props:
            meta_entry["altitude"] = props["altitude"]
        if "tags" in props:
            meta_entry["tags"] = props["tags"]
        if "layer" in props:
            meta_entry["layer"] = props["layer"]
        points_meta[props["id"]] = meta_entry
        by_pref[props["pref"]] = by_pref.get(props["pref"], 0) + 1

    out_dir = os.path.join(ROOT, "apps", app_id, "public", "data")
    os.makedirs(out_dir, exist_ok=True)

    geojson = {"type": "FeatureCollection", "features": features}
    with open(os.path.join(out_dir, "points.geojson"), "w", encoding="utf-8") as f:
        json.dump(geojson, f, ensure_ascii=False, separators=(",", ":"))

    meta = {"points": points_meta, "totals": {"pointCount": len(features), "byPref": by_pref}}
    with open(os.path.join(out_dir, "meta.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, separators=(",", ":"))

    print(f"✅ {len(features)} 地点 → apps/{app_id}/public/data/{{points.geojson, meta.json}}")
    print(f"   都道府県数: {len(by_pref)}")


if __name__ == "__main__":
    main()
