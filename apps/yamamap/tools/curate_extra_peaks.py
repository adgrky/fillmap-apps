"""日本二百名山・三百名山(101〜300位、プレミアム機能)データ生成。

出典: 「日本百選と座標値」 https://100sen.cyber-ninja.jp/
  csv/200meizan02.csv(No.101-200, 二百名山の追加100座)
  csv/300meizan02.csv(No.201-300, 三百名山の追加100座)
  緯度経度は十進数。「データの利用について特に制限を設けていません。御自由にお使いください」と明記(自由使用可)。
  山名・標高・座標は事実データ(著作権対象外)。

本アプリの基本100座(百名山, public/data/points.geojson)とは別の premium 限定オーバーレイ用データ。
登頂記録・スコアには影響しない(発見要素のみ、SPEC §11)。

実行: uv run tools/curate_extra_peaks.py
出力: public/data/extra_peaks.json
キャッシュ: tools/raw/200meizan02.csv, tools/raw/300meizan02.csv
"""
from __future__ import annotations

import csv
import io
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "tools" / "raw"
OUT = ROOT / "public" / "data" / "extra_peaks.json"

URLS = {
    "200meizan02.csv": "https://100sen.cyber-ninja.jp/csv/200meizan02.csv",
    "300meizan02.csv": "https://100sen.cyber-ninja.jp/csv/300meizan02.csv",
}


def fetch(name: str, refresh: bool) -> bytes:
    cache = RAW / name
    if cache.exists() and not refresh:
        return cache.read_bytes()
    raw = subprocess.run(["curl", "-sL", URLS[name]], capture_output=True, timeout=30, check=True).stdout
    RAW.mkdir(parents=True, exist_ok=True)
    cache.write_bytes(raw)
    return raw


def base_and_alias(raw_name: str) -> tuple[str, str]:
    m = re.match(r"^(.+?)（(.+?)）$", raw_name.strip())
    if m:
        return m.group(1).strip(), m.group(2).strip()
    return raw_name.strip(), ""


def first_pref(locality: str) -> str:
    parts = re.split(r"[・･、,]", locality.strip())
    return parts[0].strip() if parts else locality.strip()


def parse_csv(raw: bytes, rank_tag: str) -> list[dict]:
    text = raw.decode("cp932")
    rows = list(csv.reader(io.StringIO(text)))
    body = [r for r in rows[1:] if r and r[0].strip().isdigit()]

    base_counts: dict[str, int] = {}
    for r in body:
        base, _ = base_and_alias(r[1])
        base_counts[base] = base_counts.get(base, 0) + 1

    out = []
    for r in body:
        no = int(r[0])
        base, alias = base_and_alias(r[1])
        name = alias if (base_counts[base] > 1 and alias) else base
        lat = float(r[2])
        lng = float(r[3])
        altitude = int(re.sub(r"[^0-9]", "", r[5]))
        pref = first_pref(r[6])
        out.append({
            "id": f"yama_extra_{no:03d}",
            "name": name,
            "lat": round(lat, 6),
            "lng": round(lng, 6),
            "pref": pref,
            "altitude": altitude,
            "rank": rank_tag,
        })
    return out


def main() -> None:
    refresh = "--refresh" in sys.argv
    peaks_200 = parse_csv(fetch("200meizan02.csv", refresh), "二百名山")
    peaks_300 = parse_csv(fetch("300meizan02.csv", refresh), "三百名山")
    out = peaks_200 + peaks_300

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
    print(f"[written] {OUT} ({len(out)}座: 二百名山+{len(peaks_200)} / 三百名山+{len(peaks_300)})")


if __name__ == "__main__":
    main()
