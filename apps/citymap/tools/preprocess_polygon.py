"""国土数値情報 N03(行政区域)→ citymap 用 cities.geojson / meta.json 前処理。

実行: uv run --with geopandas --with shapely --with pyproj --with pyogrio tools/preprocess_polygon.py
- 入力: tools/raw/ の N03-2024(無ければ自動DL・解凍)
- 出力: public/data/cities.geojson, public/data/meta.json

メモリ節約のため都道府県を1つずつ読んで dissolve するバッチ方式。

受入基準: cityCount 1500〜2000, 都道府県数 47。
"""
from __future__ import annotations

import json
import subprocess
import sys
import zipfile
from pathlib import Path

import geopandas as gpd
import pyogrio

# --- パス ---
ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "tools" / "raw"
OUT = ROOT / "public" / "data"

N03_URL = "https://nlftp.mlit.go.jp/ksj/gml/data/N03/N03-2024/N03-20240101_GML.zip"
ZIP = RAW / "N03-2024.zip"
EXTRACT_DIR = RAW / "N03-2024"

F_PREF = "N03_001"
F_CITY = "N03_004"
F_CODE = "N03_007"

SIMPLIFY_TOL = 0.005  # 0.005度 ≈ 500m。座標丸めと組み合わせて使う
COORD_PRECISION = 4   # 小数4桁 ≈ 11m精度。これで座標文字列が大幅に短くなる
SIZE_WARN_MB = 3.0


def find_shp() -> Path:
    """展開済み SHP を探す(_prefecture 除外)。なければ DL して解凍。"""
    def _scan() -> Path | None:
        if EXTRACT_DIR.exists():
            for p in sorted(EXTRACT_DIR.rglob("*.shp")):
                if "_prefecture" not in p.name:
                    return p
        return None

    shp = _scan()
    if shp:
        return shp

    RAW.mkdir(parents=True, exist_ok=True)
    if not ZIP.exists():
        print(f"N03-2024 をダウンロード中: {N03_URL}")
        subprocess.run(
            ["curl", "-sL", "--max-time", "600", "-o", str(ZIP), N03_URL], check=True
        )
    print("解凍中...")
    with zipfile.ZipFile(ZIP) as z:
        z.extractall(EXTRACT_DIR)

    shp = _scan()
    if shp:
        return shp
    sys.exit(f"SHP ファイルが見つかりません: {EXTRACT_DIR}")


def round_coords(geom_dict: dict, precision: int) -> dict:
    """GeoJSON ジオメトリの座標を指定桁数に丸める(再帰)。"""
    def _round(c: object) -> object:
        if isinstance(c, (int, float)):
            return round(c, precision)
        if isinstance(c, (list, tuple)):
            return [_round(x) for x in c]
        return c
    return {**geom_dict, "coordinates": _round(geom_dict["coordinates"])}


def main() -> None:
    shp_path = find_shp()
    print(f"入力: {shp_path}")

    # --- 属性だけ読んで都道府県リストを取得(ジオメトリなし → メモリ少) ---
    df_attr = pyogrio.read_dataframe(str(shp_path), read_geometry=False,
                                     columns=[F_PREF, F_CODE])
    df_attr = df_attr[df_attr[F_CODE].notna() & (df_attr[F_CODE].str.strip() != "")]
    prefs = sorted(df_attr[F_PREF].dropna().unique())
    print(f"都道府県: {len(prefs)} 件, コードあり行: {len(df_attr)}")

    OUT.mkdir(parents=True, exist_ok=True)
    features: list[dict] = []
    by_pref: dict[str, int] = {}

    for i, pref in enumerate(prefs, 1):
        safe = pref.replace("'", "''")
        gdf = gpd.read_file(str(shp_path), where=f"{F_PREF} = '{safe}'", engine="pyogrio")
        gdf = gdf[gdf[F_CODE].notna() & (gdf[F_CODE].str.strip() != "")].copy()
        if gdf.empty:
            continue

        # WGS84 変換
        if gdf.crs and gdf.crs.to_epsg() != 4326:
            gdf = gdf.to_crs("EPSG:4326")

        gdf["_id"] = gdf[F_CODE].str.strip()
        gdf["_city"] = gdf[F_CITY].fillna("").str.strip()

        # 飛び地・島嶼を dissolve でまとめる
        dissolved = gdf.dissolve(by="_id", as_index=False)

        # 簡略化
        dissolved["geometry"] = dissolved["geometry"].simplify(
            SIMPLIFY_TOL, preserve_topology=True
        )

        count = 0
        for _, row in dissolved.iterrows():
            geom = row["geometry"]
            if geom is None or geom.is_empty:
                continue
            features.append({
                "type": "Feature",
                "properties": {
                    "id": str(row["_id"]),
                    "name": str(row["_city"]),
                    "pref": pref,
                },
                "geometry": round_coords(geom.__geo_interface__, COORD_PRECISION),
            })
            count += 1

        by_pref[pref] = count
        print(f"  [{i:02d}/47] {pref}: {count} 自治体")

    fc = {"type": "FeatureCollection", "features": features}

    # cities マップ(id → {name, pref}) — prefCompletion / isIsland 称号用
    cities_map = {
        f["properties"]["id"]: {
            "name": f["properties"]["name"],
            "pref": f["properties"]["pref"],
        }
        for f in features
    }
    meta = {
        "cities": cities_map,
        "totals": {
            "cityCount": len(features),
            "byPref": by_pref,
        },
    }

    cities_path = OUT / "cities.geojson"
    meta_path = OUT / "meta.json"
    cities_path.write_text(
        json.dumps(fc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )
    meta_path.write_text(
        json.dumps(meta, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )

    size_mb = cities_path.stat().st_size / 1024 / 1024
    print(f"\n=== 生成完了 ===")
    print(f"自治体数: {len(features)}")
    print(f"都道府県数: {len(by_pref)}")
    print(f"cities.geojson: {size_mb:.2f} MB")
    if size_mb > SIZE_WARN_MB:
        print(f"⚠️  {SIZE_WARN_MB}MB 超 → 地方ブロック8分割を検討")
    else:
        print("✅ サイズ OK")

    assert len(by_pref) == 47, f"都道府県数が47ではありません: {len(by_pref)}"
    assert 1500 <= len(features) <= 2000, f"自治体数が想定外: {len(features)}"
    print("受入チェック: ✅ 通過")


if __name__ == "__main__":
    main()
