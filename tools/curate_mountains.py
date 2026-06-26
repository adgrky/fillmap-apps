#!/usr/bin/env python3
"""
百名山キュレーション: 一次データ(日本百選データベース)を curated/mountains.csv に正規化。

出典(SPEC §E6/§E7 著作権監査用):
  日本百選と座標値（経緯度数値） https://100sen.cyber-ninja.jp/
  ファイル: csv/100meizan02.csv（緯度経度は十進数。自由使用可と明記）
  座標・標高・山名・所在地は「事実データ」であり著作権の対象外。データベースの
  丸ごと複製ではなく、百名山100座のみを抽出し本アプリ用フォーマットへ変換している。

入力 : tools/raw/100meizan02.csv (cp932)
出力 : tools/curated/mountains.csv (utf-8, 列: id,name,lat,lng,pref,altitude,tags)
"""

import csv
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "tools", "raw", "100meizan02.csv")
OUT = os.path.join(ROOT, "tools", "curated", "mountains.csv")

# 出典コメント(preprocess 側で # 行はスキップする)
HEADER_COMMENT = [
    "# 日本百名山 100座 — 本アプリ用キュレーションデータ",
    "# 出典: 日本百選と座標値 https://100sen.cyber-ninja.jp/ (csv/100meizan02.csv, 緯度経度十進数・自由使用可)",
    "# 座標/標高/山名/所在地は事実データ(著作権対象外)。百名山100座のみ抽出。写真・解説文は非収載(SPEC §E7)。",
]


def base_and_alias(raw_name: str) -> tuple[str, str]:
    """『主名（別名）』を主名と別名に分解。別名が無ければ alias は空。"""
    m = re.match(r"^(.+?)（(.+?)）$", raw_name.strip())
    if m:
        return m.group(1).strip(), m.group(2).strip()
    return raw_name.strip(), ""


def first_pref(locality: str) -> str:
    """所在地『岩手県・秋田県』等から代表(先頭)の都道府県を取り出す。"""
    # 全角中黒・半角中黒・読点・カンマ区切りに対応
    parts = re.split(r"[・･、,]", locality.strip())
    return parts[0].strip() if parts else locality.strip()


def main() -> None:
    with open(RAW, encoding="cp932", newline="") as f:
        rows = list(csv.reader(f))

    header, body = rows[0], [r for r in rows[1:] if r and r[0].strip().isdigit()]

    # 主名の出現回数を数え、重複する主名は別名(会津駒ヶ岳 等)を表示名に採用
    base_counts: dict[str, int] = {}
    for r in body:
        base, _ = base_and_alias(r[1])
        base_counts[base] = base_counts.get(base, 0) + 1

    out_rows = []
    for r in body:
        no = int(r[0])
        base, alias = base_and_alias(r[1])
        name = alias if (base_counts[base] > 1 and alias) else base
        lat = float(r[2])
        lng = float(r[3])
        altitude = int(re.sub(r"[^0-9]", "", r[5]))
        pref = first_pref(r[6])
        tags = "百名山"
        if altitude >= 3000:
            tags += "|3000m峰"
        out_rows.append([f"yama_{no:03d}", name, f"{lat:.6f}", f"{lng:.6f}", pref, altitude, tags])

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8", newline="") as f:
        for c in HEADER_COMMENT:
            f.write(c + "\n")
        w = csv.writer(f)
        w.writerow(["id", "name", "lat", "lng", "pref", "altitude", "tags"])
        w.writerows(out_rows)

    print(f"✅ {len(out_rows)} 座 → {os.path.relpath(OUT, ROOT)}")
    print(f"   3000m峰: {sum(1 for r in out_rows if '3000m峰' in r[6])} 座")
    print(f"   都道府県数: {len(set(r[4] for r in out_rows))}")


if __name__ == "__main__":
    main()
