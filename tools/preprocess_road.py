#!/usr/bin/env python3
"""
国道 LINE 前処理(SPEC §A5 / §E6)。
OSM Overpass の route=road / network=JP:national リレーション(out geom)を
路線 GeoJSON(LineString) + meta.json に変換する。

⚠️ ライセンス(必須・SPEC §E7):
  © OpenStreetMap contributors / ODbL。出典は設定画面に明記する。

取得元クエリ(tools/raw/osm/kokudo_b1..b5.json):
  [out:json];relation["route"="road"]["network"="JP:national"]["ref"~"..."];out geom;
  (overpass-api.de / 全国を ref 番号レンジで5分割取得)

集約: OSMは1国道を複数リレーション(県別/方向別)に分割するため、ref番号で集約。
  同一 way は way-id で重複排除(上下線の二重計上を防ぐ)。

出力:
  apps/kokudomap/public/data/lines.geojson   … FeatureCollection(LineString)
  apps/kokudomap/public/data/stations.geojson … 空(LINEモードのMapView互換)
  apps/kokudomap/public/data/meta.json        … { lines, totals }

実行:
  uv run --with shapely --with pyproj tools/preprocess_road.py
"""

import glob
import json
import os

from shapely.geometry import LineString
from shapely.ops import transform
from pyproj import Transformer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_GLOB = os.path.join(ROOT, "tools", "raw", "osm", "kokudo_b*.json")
OUT_DIR = os.path.join(ROOT, "apps", "kokudomap", "public", "data")

SIMPLIFY_TOL = 0.0025  # 度(約250m)。全国表示主体なので粗めでサイズ優先
COORD_PRECISION = 4    # 約11m

# 等積投影(EPSG:6933)で距離(km)を測る
_to_eq = Transformer.from_crs("EPSG:4326", "EPSG:6933", always_xy=True).transform


def length_km(coords: list) -> float:
    if len(coords) < 2:
        return 0.0
    geom = transform(_to_eq, LineString(coords))
    return geom.length / 1000.0


def main() -> None:
    # ref番号 -> {name, ways: {way_id: coords}}
    routes: dict[str, dict] = {}
    files = sorted(glob.glob(RAW_GLOB))
    if not files:
        raise SystemExit(f"入力なし: {RAW_GLOB}")

    for path in files:
        data = json.load(open(path, encoding="utf-8"))
        for el in data.get("elements", []):
            if el.get("type") != "relation":
                continue
            tags = el.get("tags", {})
            ref = tags.get("ref")
            if not ref or not ref.isdigit():
                continue
            name = tags.get("name") or f"国道{ref}号"
            r = routes.setdefault(ref, {"name": name, "ways": {}})
            for m in el.get("members", []):
                if m.get("type") == "way" and "geometry" in m:
                    wid = m.get("ref")
                    coords = [(p["lon"], p["lat"]) for p in m["geometry"]]
                    if len(coords) >= 2:
                        r["ways"][wid] = coords

    features = []
    lines_meta: dict = {}
    total_km = 0.0

    seg_total = 0
    for ref in sorted(routes, key=lambda x: int(x)):
        r = routes[ref]
        route_id = f"国道{ref}号"
        route_km = 0.0
        multi: list = []  # 1国道=1 MultiLineString(feature数を抑えてサイズ削減)
        for coords in r["ways"].values():
            route_km += length_km(coords)
            simplified = LineString(coords).simplify(SIMPLIFY_TOL, preserve_topology=False)
            sc = [[round(x, COORD_PRECISION), round(y, COORD_PRECISION)] for x, y in simplified.coords]
            if len(sc) >= 2:
                multi.append(sc)
        if multi:
            seg_total += len(multi)
            features.append({
                "type": "Feature",
                "properties": {"lineId": route_id, "lineName": r["name"], "railType": "国道"},
                "geometry": {"type": "MultiLineString", "coordinates": multi},
            })
        route_km = round(route_km, 1)
        total_km += route_km
        lines_meta[route_id] = {
            "operator": "",
            "lineName": r["name"],
            "lengthKm": route_km,
            "railType": "国道",
            "pref": [],
            "ref": int(ref),
        }

    os.makedirs(OUT_DIR, exist_ok=True)
    with open(os.path.join(OUT_DIR, "lines.geojson"), "w", encoding="utf-8") as f:
        json.dump({"type": "FeatureCollection", "features": features}, f, ensure_ascii=False, separators=(",", ":"))
    with open(os.path.join(OUT_DIR, "stations.geojson"), "w", encoding="utf-8") as f:
        json.dump({"type": "FeatureCollection", "features": []}, f, ensure_ascii=False)

    total_km = round(total_km, 1)
    meta = {
        "lines": lines_meta,
        "totals": {
            "lengthKm": total_km,
            "lineCount": len(lines_meta),
            "stationCount": 0,
            "byPref": {},
            "byRailType": {"国道": total_km},
        },
    }
    with open(os.path.join(OUT_DIR, "meta.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, separators=(",", ":"))

    size_mb = os.path.getsize(os.path.join(OUT_DIR, "lines.geojson")) / 1048576
    print(f"✅ 国道 {len(lines_meta)} 本(feature {len(features)} / 区間 {seg_total}) / 総延長 {total_km:,.0f}km")
    print(f"   lines.geojson: {size_mb:.1f}MB")
    print(f"   ref範囲: {min(int(r) for r in routes)}〜{max(int(r) for r in routes)}")


if __name__ == "__main__":
    main()
