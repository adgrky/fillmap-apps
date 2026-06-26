"""
citymap 地方ブロック別 GeoJSON 分割(SPEC §A1 遅延ロード対応)
入力: apps/citymap/public/data/cities.geojson
出力: apps/citymap/public/data/blocks/*.geojson  (8ファイル)
      apps/citymap/public/data/blocks/manifest.json (ブロック一覧+bbox)

使い方: python tools/split_citymap_geojson.py
"""

import json
import os

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC  = os.path.join(REPO, "apps/citymap/public/data/cities.geojson")
OUT  = os.path.join(REPO, "apps/citymap/public/data/blocks")

# 8地方ブロック定義(§A1)
BLOCKS = [
    ("01_hokkaido",  "北海道",     ["北海道"]),
    ("02_tohoku",    "東北",       ["青森県","岩手県","宮城県","秋田県","山形県","福島県"]),
    ("03_kanto",     "関東",       ["茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県","山梨県","静岡県"]),
    ("04_chubu",     "中部",       ["新潟県","富山県","石川県","福井県","長野県","岐阜県","愛知県"]),
    ("05_kinki",     "近畿",       ["三重県","滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県"]),
    ("06_chugoku",   "中国四国",   ["鳥取県","島根県","岡山県","広島県","山口県","徳島県","香川県","愛媛県","高知県"]),
    ("07_kyushu",    "九州",       ["福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県"]),
    ("08_okinawa",   "沖縄",       ["沖縄県"]),
]

# bbox 計算(turf 不使用)
def bbox_of(features):
    w, s, e, n = 180, 90, -180, -90
    def walk(c):
        nonlocal w, s, e, n
        if isinstance(c, list) and len(c) == 2 and isinstance(c[0], (int, float)):
            lng, lat = c[0], c[1]
            w = min(w, lng); e = max(e, lng)
            s = min(s, lat); n = max(n, lat)
        elif isinstance(c, list):
            for x in c:
                walk(x)
    for f in features:
        walk(f["geometry"]["coordinates"])
    return [w, s, e, n] if features else None


def main():
    with open(SRC, encoding="utf-8") as f:
        src = json.load(f)

    features = src["features"]
    pref_map = {feat["properties"]["id"]: feat["properties"]["pref"] for feat in features}

    # 都道府県 → ブロックID の逆引き
    pref_to_block = {}
    for block_id, _, prefs in BLOCKS:
        for p in prefs:
            pref_to_block[p] = block_id

    # 未割り当て確認
    all_prefs = set(feat["properties"]["pref"] for feat in features)
    unmapped = all_prefs - set(pref_to_block.keys())
    if unmapped:
        print(f"⚠️  未割り当ての都道府県: {unmapped}")

    os.makedirs(OUT, exist_ok=True)

    manifest = []
    total = 0

    for block_id, block_name, prefs in BLOCKS:
        block_feats = [f for f in features if f["properties"]["pref"] in set(prefs)]
        bbox = bbox_of(block_feats)
        fc = {"type": "FeatureCollection", "features": block_feats}

        path = os.path.join(OUT, f"{block_id}.geojson")
        text = json.dumps(fc, ensure_ascii=False, separators=(",", ":"))
        with open(path, "w", encoding="utf-8") as f:
            f.write(text)

        size_kb = len(text.encode()) / 1024
        total += len(block_feats)
        print(f"  {block_id}: {len(block_feats):4d} 自治体  {size_kb:7.1f} KB  bbox={bbox}")

        manifest.append({
            "id": block_id,
            "name": block_name,
            "file": f"data/blocks/{block_id}.geojson",
            "bbox": bbox,
            "count": len(block_feats),
        })

    # manifest.json
    manifest_path = os.path.join(OUT, "manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump({"blocks": manifest}, f, ensure_ascii=False, indent=2)

    print(f"\n✅ 合計 {total} 自治体 → {OUT}/")
    print(f"   manifest.json 生成完了")


if __name__ == "__main__":
    main()
