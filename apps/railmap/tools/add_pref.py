"""N03(行政区域)交差により meta.json の pref / totals.byPref を付与(SPEC §3.2 / §8.1)。

実行: uv run --with shapely tools/add_pref.py
- 入力: public/data/{lines.geojson,meta.json} と N03-2024 都道府県別データ(自動DL)
- 出力: public/data/meta.json を上書き(lines[].pref, totals.byPref)

N03全国版は611MBあり空きディスクを圧迫するため、都道府県別(各数MB〜数十MB)を
1件ずつDL→ポリゴン化→即削除する。ピーク使用量を1県分に抑える。

SPEC原則: 推測せず実データの属性を確認してから書く。N03_001(都道府県名)は
N03-20240101_13 の実データで確認済み(値は "東京都" 形式)。
"""
from __future__ import annotations

import json
import shutil
import sys
import urllib.request
import zipfile
from pathlib import Path

from shapely.geometry import shape
from shapely.ops import unary_union
from shapely.strtree import STRtree

APP = Path(__file__).resolve().parent.parent
DATA = APP / "public" / "data"
WORK = APP / "tools" / "raw" / "n03work"

N03_BASE = "https://nlftp.mlit.go.jp/ksj/gml/data/N03/N03-2024/N03-20240101_{code:02d}_GML.zip"

# 県ポリゴンの簡略化許容誤差(度)。県境判定に効くので控えめに。
# 0.0003度 ≒ 約33m。鉄道の県境またぎ判定には十分。
SIMPLIFY_TOL = 0.0003


def to_app_pref(n03_name: str) -> str:
    """N03の "東京都"/"大阪府"/"青森県" → アプリ表記 "東京"/"大阪"/"青森"。
    北海道のみ接尾辞を落とさない(StatsPanel の PREFS と一致させる)。"""
    if n03_name == "北海道":
        return "北海道"
    if n03_name.endswith(("都", "府", "県")):
        return n03_name[:-1]
    return n03_name


def load_pref_polygon(code: int) -> tuple[str, object]:
    """1県分をDL→GeoJSON読込→単一ポリゴンに結合→一時ファイル削除。"""
    WORK.mkdir(parents=True, exist_ok=True)
    zip_path = WORK / f"n03_{code:02d}.zip"
    url = N03_BASE.format(code=code)

    urllib.request.urlretrieve(url, zip_path)
    try:
        with zipfile.ZipFile(zip_path) as z:
            name = next(n for n in z.namelist() if n.endswith(".geojson"))
            gj = json.loads(z.read(name).decode("utf-8"))
    finally:
        zip_path.unlink(missing_ok=True)

    n03_name = gj["features"][0]["properties"]["N03_001"]
    geoms = [shape(f["geometry"]) for f in gj["features"] if f.get("geometry")]
    poly = unary_union(geoms).simplify(SIMPLIFY_TOL, preserve_topology=True)
    return to_app_pref(n03_name), poly


def main() -> int:
    lines_gj = json.loads((DATA / "lines.geojson").read_text(encoding="utf-8"))
    meta = json.loads((DATA / "meta.json").read_text(encoding="utf-8"))

    # lineId ごとに全セグメントを束ねる(判定回数を 21933 → 597 に削減)
    by_line: dict[str, list] = {}
    for f in lines_gj["features"]:
        by_line.setdefault(f["properties"]["lineId"], []).append(shape(f["geometry"]))
    line_geoms = {lid: unary_union(gs) for lid, gs in by_line.items()}
    print(f"路線: {len(line_geoms)}本 / セグメント: {len(lines_gj['features'])}件", flush=True)

    pref_names: list[str] = []
    pref_polys: list[object] = []
    for code in range(1, 48):
        name, poly = load_pref_polygon(code)
        pref_names.append(name)
        pref_polys.append(poly)
        print(f"  [{code:02d}] {name} 取得", flush=True)

    tree = STRtree(pref_polys)

    # 各路線がどの県に交差するか
    line_prefs: dict[str, list[str]] = {}
    for lid, geom in line_geoms.items():
        hits = [i for i in tree.query(geom) if pref_polys[i].intersects(geom)]
        # PREFS(北→南)の並びを保つため code 順(= pref_names の並び)でソート
        line_prefs[lid] = [pref_names[i] for i in sorted(hits)]

    # meta.json 更新。UIの prefTotal と同じ定義(路線全長を通過県すべてに計上)。
    by_pref: dict[str, float] = {}
    missing = 0
    for lid, m in meta["lines"].items():
        prefs = line_prefs.get(lid, [])
        if not prefs:
            missing += 1
        m["pref"] = prefs
        for p in prefs:
            by_pref[p] = round(by_pref.get(p, 0.0) + m["lengthKm"], 1)
    meta["totals"]["byPref"] = by_pref

    (DATA / "meta.json").write_text(
        json.dumps(meta, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )

    if WORK.exists():
        shutil.rmtree(WORK)

    covered = len(meta["lines"]) - missing
    print(f"\n付与完了: {covered}/{len(meta['lines'])}路線に都道府県を付与")
    print(f"県数: {len(by_pref)}/47")
    if missing:
        print(f"⚠ どの県にも交差しなかった路線: {missing}本")
    return 0


if __name__ == "__main__":
    sys.exit(main())
