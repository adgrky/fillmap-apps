"""平成の大合併で消滅した市町村データセット(プレミアム機能)の生成。

出典: 総務省「市町村名逆引き一覧」(https://www.soumu.go.jp/gapei/hensen.html、都道府県別ページ)。
平成11年3月31日時点で存在し、合併により名称が変わった/消滅した市町村を抽出する。
座標は出典に含まれないため、合併後の現市町村(N03由来 cities.geojson)の重心を採用し、
同一市町村に複数の旧自治体が合流する場合は決定的なジッターで散らして表示する。

実行: uv run tools/curate_dissolved.py
出力: public/data/dissolved.json
キャッシュ: tools/raw/hensen/<slug>.html (再実行時は再利用、--refresh で再取得)
"""
from __future__ import annotations

import csv
import hashlib
import io
import json
import math
import re
import subprocess
import sys
import time
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = ROOT / "tools" / "raw" / "hensen"
OUT_PATH = ROOT / "public" / "data" / "dissolved.json"
META_PATH = ROOT / "public" / "data" / "meta.json"
CITIES_PATH = ROOT / "public" / "data" / "cities.geojson"

SLUGS = [
    "hokkaido", "aomori", "iwate", "miyagi", "akita", "yamagata", "hukushima", "ibaraki",
    "tochigi", "gunma", "saitama", "chiba", "tokyo", "kanagawa", "nigata", "toyama",
    "ishikawa", "hukui", "yamanashi", "nagano", "gihu", "shizuoka", "aichi", "mie",
    "shiga", "kyoto", "osaka", "hyogo", "nara", "wakayama", "tottori", "shimane",
    "okayama", "hiroshima", "yamaguchi", "tokushima", "kagawa", "ehime", "kochi",
    "hukuoka", "saga", "nagasaki", "kumamoto", "oita", "miyazaki", "kagoshima", "okinawa",
]


def fetch_pref_html(slug: str, refresh: bool) -> str:
    cache = RAW_DIR / f"{slug}.html"
    if cache.exists() and not refresh:
        return cache.read_text(encoding="utf-8")
    url = f"https://www.soumu.go.jp/gapei/hensen_{slug}.html"
    raw = subprocess.run(["curl", "-sL", url], capture_output=True, timeout=30, check=True).stdout
    html = raw.decode("shift_jis", errors="replace")
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    cache.write_text(html, encoding="utf-8")
    time.sleep(0.3)
    return html


def clean(s: str) -> str:
    s = re.sub(r"<br\s*/?>", "", s)
    s = re.sub(r"<[^>]+>", "", s)
    return s.replace("&nbsp;", "").strip()


def strip_county(name: str) -> str:
    return name.split("　")[-1] if "　" in name else name


def parse_dissolved_rows(html: str) -> list[dict]:
    rows = []
    for tr in re.findall(r"<tr[^>]*>(.*?)</tr>", html, re.S):
        tds = re.findall(r"<td[^>]*>(.*?)</td>", tr, re.S)
        if len(tds) < 6:
            continue
        pref_old, name_old, gapei_date, name_new, pref_now, name_now = [clean(t) for t in tds[:6]]
        if not name_old or pref_old in ("", "平成11年3月31日時点市町村"):
            continue
        if not gapei_date:
            continue  # 合併なし(存続)
        if name_old == name_new:
            continue  # 自分が存続(他を吸収しただけ)
        rows.append({
            "pref": pref_old,
            "old_name": name_old,
            "gapei_date": " ".join(gapei_date.split()),
            "new_name": name_new,
            "pref_now": pref_now,
            "name_now": name_now,
        })
    return rows


def polygon_centroid(coords) -> tuple[float, float]:
    ring = coords[0]
    xs = [p[0] for p in ring]
    ys = [p[1] for p in ring]
    return sum(xs) / len(xs), sum(ys) / len(ys)


def geom_centroid(geom) -> tuple[float, float]:
    if geom["type"] == "Polygon":
        return polygon_centroid(geom["coordinates"])
    if geom["type"] == "MultiPolygon":
        best = max(geom["coordinates"], key=lambda p: len(p[0]))
        return polygon_centroid(best)
    raise ValueError(geom["type"])


def main() -> None:
    refresh = "--refresh" in sys.argv

    rows: list[dict] = []
    for slug in SLUGS:
        html = fetch_pref_html(slug, refresh)
        rows.extend(parse_dissolved_rows(html))
    print(f"[parsed] {len(rows)} 件の消滅自治体レコード(47都道府県)")

    meta = json.loads(META_PATH.read_text(encoding="utf-8"))
    cities_meta = meta["cities"]
    name_to_id = {(p["pref"], p["name"]): cid for cid, p in cities_meta.items()}

    gj = json.loads(CITIES_PATH.read_text(encoding="utf-8"))
    id_to_centroid = {f["properties"]["id"]: geom_centroid(f["geometry"]) for f in gj["features"]}

    matched = []
    unmatched = 0
    for r in rows:
        name_now_clean = strip_county(r["name_now"])
        cid = name_to_id.get((r["pref_now"], name_now_clean))
        if cid is None:
            unmatched += 1
            continue
        lng, lat = id_to_centroid[cid]
        matched.append({**r, "succ_id": cid, "lng": lng, "lat": lat})
    print(f"[matched] {len(matched)} 件 / unmatched {unmatched} 件(現行N03に紐付かない名称変更等)")

    groups: dict[str, list[dict]] = defaultdict(list)
    for m in matched:
        groups[m["succ_id"]].append(m)

    out = []
    for succ_id, items in groups.items():
        n = len(items)
        for i, m in enumerate(items):
            if n == 1:
                jlng, jlat = 0.0, 0.0
            else:
                angle = 2 * math.pi * i / n
                r_deg = 0.045  # 同一合併先に複数旧自治体がある場合の表示用ジッター(約3〜5km相当)
                jlng = r_deg * math.cos(angle)
                jlat = r_deg * math.sin(angle)
            uid = hashlib.sha1(f"{m['pref']}-{m['old_name']}".encode("utf-8")).hexdigest()[:10]
            out.append({
                "id": uid,
                "pref": m["pref"],
                "name": strip_county(m["old_name"]),
                "county": m["old_name"].split("　")[0] if "　" in m["old_name"] else None,
                "gapeiDate": m["gapei_date"],
                "mergedInto": m["new_name"],
                "succId": succ_id,
                "lng": round(m["lng"] + jlng, 5),
                "lat": round(m["lat"] + jlat, 5),
            })

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
    print(f"[written] {OUT_PATH} ({len(out)} 件)")


if __name__ == "__main__":
    main()
