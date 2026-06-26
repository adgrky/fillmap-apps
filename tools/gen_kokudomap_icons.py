"""
kokudomap PWA アイコン生成 (192×192 / 512×512)
出力先: apps/kokudomap/public/icons/
実行: uv run --with pillow tools/gen_kokudomap_icons.py
国道標識(おにぎり)風: 紺背景に青の盾型、白い道(中央線)。
"""

import os
from PIL import Image, ImageDraw

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "apps", "kokudomap", "public", "icons")
os.makedirs(OUT_DIR, exist_ok=True)

BG = (11, 14, 20)        # #0b0e14
BLUE = (56, 189, 248)    # neon-blue #38bdf8
WHITE = (255, 255, 255)


def make_icon(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), BG)
    d = ImageDraw.Draw(img)

    cx = size / 2
    # 国道おにぎり(上が広く下が尖る盾型)を多角形で近似
    top_y = size * 0.20
    bot_y = size * 0.84
    half = size * 0.32
    shield = [
        (cx - half, top_y + size * 0.06),
        (cx - half * 0.5, top_y),
        (cx + half * 0.5, top_y),
        (cx + half, top_y + size * 0.06),
        (cx + half * 0.45, bot_y - size * 0.10),
        (cx, bot_y),
        (cx - half * 0.45, bot_y - size * 0.10),
    ]
    d.polygon(shield, fill=BLUE)

    # 白い道(下が広い台形)
    rt_y0 = top_y + size * 0.16
    rt_y1 = bot_y - size * 0.10
    d.polygon([
        (cx - size * 0.04, rt_y0),
        (cx + size * 0.04, rt_y0),
        (cx + size * 0.12, rt_y1),
        (cx - size * 0.12, rt_y1),
    ], fill=BG)

    # 中央破線
    n = 3
    seg = (rt_y1 - rt_y0) / (n * 2 - 1)
    for i in range(n):
        y0 = rt_y0 + seg * (i * 2)
        d.line([(cx, y0), (cx, y0 + seg)], fill=WHITE, width=max(2, int(size // 38 * (1 + i * 0.4))))

    return img


for px in (192, 512):
    img = make_icon(px)
    path = os.path.join(OUT_DIR, f"icon-{px}.png")
    img.save(path, "PNG")
    print(f"Generated: {path}")

print("Done.")
