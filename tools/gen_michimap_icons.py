"""
michimap PWA アイコン生成 (192×192 / 512×512)
出力先: apps/michimap/public/icons/
実行: uv run --with pillow tools/gen_michimap_icons.py
道路標識風: 紺背景にオレンジの看板、白い道(中央線)。
"""

import os
from PIL import Image, ImageDraw

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "apps", "michimap", "public", "icons")
os.makedirs(OUT_DIR, exist_ok=True)

BG = (11, 14, 20)        # #0b0e14
ORANGE = (251, 146, 60)  # orange-400 #fb923c
WHITE = (255, 255, 255)


def make_icon(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), BG)
    d = ImageDraw.Draw(img)

    # オレンジの角丸看板
    m = size * 0.16
    r = size * 0.12
    d.rounded_rectangle([m, m, size - m, size - m], radius=r, fill=ORANGE)

    # 白い道(下が広い台形=奥行き)
    cx = size / 2
    top_y = size * 0.34
    bot_y = size * 0.80
    top_half = size * 0.05
    bot_half = size * 0.17
    road = [
        (cx - top_half, top_y),
        (cx + top_half, top_y),
        (cx + bot_half, bot_y),
        (cx - bot_half, bot_y),
    ]
    d.polygon(road, fill=BG)

    # 中央の破線
    dash_w = max(2, size // 40)
    n = 4
    seg = (bot_y - top_y) / (n * 2 - 1)
    for i in range(n):
        y0 = top_y + seg * (i * 2)
        y1 = y0 + seg
        # 遠近で線幅を少し変える
        d.line([(cx, y0), (cx, y1)], fill=WHITE, width=int(dash_w * (1 + i * 0.3)))

    return img


for px in (192, 512):
    img = make_icon(px)
    path = os.path.join(OUT_DIR, f"icon-{px}.png")
    img.save(path, "PNG")
    print(f"Generated: {path}")

print("Done.")
