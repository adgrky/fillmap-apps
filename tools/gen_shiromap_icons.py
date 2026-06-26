"""
shiromap PWA アイコン生成 (192×192 / 512×512)
出力先: apps/shiromap/public/icons/
実行: uv run --with pillow tools/gen_shiromap_icons.py
天守風: 紺背景に金の天守シルエット(石垣+櫓+屋根)。
"""

import os
from PIL import Image, ImageDraw

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "apps", "shiromap", "public", "icons")
os.makedirs(OUT_DIR, exist_ok=True)

BG = (11, 14, 20)        # #0b0e14
GOLD = (234, 179, 8)     # yellow-500 #eab308
GOLD_DIM = (253, 224, 71)  # yellow-300


def make_icon(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), BG)
    d = ImageDraw.Draw(img)
    cx = size / 2

    # 石垣(下の台形)
    d.polygon([
        (size * 0.22, size * 0.82),
        (size * 0.78, size * 0.82),
        (size * 0.70, size * 0.64),
        (size * 0.30, size * 0.64),
    ], fill=GOLD)

    # 天守 本体(矩形)
    d.rectangle([size * 0.36, size * 0.40, size * 0.64, size * 0.64], fill=GOLD)

    # 上層の屋根(下向き台形)
    d.polygon([
        (size * 0.30, size * 0.42),
        (size * 0.70, size * 0.42),
        (size * 0.60, size * 0.34),
        (size * 0.40, size * 0.34),
    ], fill=GOLD_DIM)

    # 最上層(小さい矩形)
    d.rectangle([size * 0.44, size * 0.24, size * 0.56, size * 0.34], fill=GOLD)

    # 屋根の頂(三角)
    d.polygon([
        (size * 0.40, size * 0.26),
        (size * 0.60, size * 0.26),
        (cx, size * 0.18),
    ], fill=GOLD_DIM)

    return img


for px in (192, 512):
    img = make_icon(px)
    path = os.path.join(OUT_DIR, f"icon-{px}.png")
    img.save(path, "PNG")
    print(f"Generated: {path}")

print("Done.")
