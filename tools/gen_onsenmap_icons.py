"""
onsenmap PWA アイコン生成 (192×192 / 512×512)
出力先: apps/onsenmap/public/icons/
実行: uv run --with pillow tools/gen_onsenmap_icons.py
温泉マーク(♨)風: 紺背景に朱の湯舟と湯けむり3本。
"""

import os
from PIL import Image, ImageDraw

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "apps", "onsenmap", "public", "icons")
os.makedirs(OUT_DIR, exist_ok=True)

BG = (11, 14, 20)        # #0b0e14
ROSE = (251, 113, 133)   # rose-400 #fb7185
ROSE_DIM = (253, 164, 175)  # rose-300


def make_icon(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), BG)
    d = ImageDraw.Draw(img)
    cx = size / 2

    # 湯舟(下の弧)
    d.arc([size * 0.22, size * 0.50, size * 0.78, size * 0.92], start=0, end=180, fill=ROSE, width=max(3, size // 22))
    d.line([(size * 0.22, size * 0.71), (size * 0.78, size * 0.71)], fill=ROSE, width=max(3, size // 26))

    # 湯けむり3本(波線)
    w = max(3, size // 26)
    for i, bx in enumerate((0.36, 0.50, 0.64)):
        x = size * bx
        pts = []
        n = 14
        for k in range(n + 1):
            t = k / n
            y = size * (0.46 - t * 0.30)  # 上へ
            dx = (size * 0.035) * (1 if (k // 2) % 2 == 0 else -1)
            pts.append((x + dx, y))
        col = ROSE_DIM if i == 1 else ROSE
        d.line(pts, fill=col, width=w, joint="curve")

    return img


for px in (192, 512):
    img = make_icon(px)
    path = os.path.join(OUT_DIR, f"icon-{px}.png")
    img.save(path, "PNG")
    print(f"Generated: {path}")

print("Done.")
