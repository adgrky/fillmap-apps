"""
citymap PWA アイコン生成 (192×192 / 512×512)
出力先: apps/citymap/public/icons/
"""

import os
import math
from PIL import Image, ImageDraw

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "apps", "citymap", "public", "icons")
os.makedirs(OUT_DIR, exist_ok=True)

BG = (11, 14, 20)          # #0b0e14
CYAN = (103, 232, 249)     # cyan-300
WHITE = (255, 255, 255)
DIM = (139, 147, 163)      # #8b93a3


def make_icon(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), BG)
    d = ImageDraw.Draw(img)

    cx, cy = size / 2, size / 2
    r = size * 0.38

    # 外周リング
    ring_w = max(2, size // 48)
    d.ellipse(
        [cx - r, cy - r, cx + r, cy + r],
        outline=CYAN,
        width=ring_w,
    )

    # 地図ピン風シルエット: 中央に小さな円
    inner_r = r * 0.28
    d.ellipse(
        [cx - inner_r, cy - inner_r, cx + inner_r, cy + inner_r],
        fill=CYAN,
    )

    # 四隅に都道府県ドット的な装飾（放射状に4点）
    dot_r = max(2, size // 60)
    dot_dist = r * 0.68
    for angle_deg in [45, 135, 225, 315]:
        angle = math.radians(angle_deg)
        dx = cx + dot_dist * math.cos(angle)
        dy = cy + dot_dist * math.sin(angle)
        d.ellipse([dx - dot_r, dy - dot_r, dx + dot_r, dy + dot_r], fill=DIM)

    # 下部に薄いアーク（進捗バーイメージ）
    arc_w = max(2, size // 36)
    arc_r = r * 0.82
    d.arc(
        [cx - arc_r, cy - arc_r, cx + arc_r, cy + arc_r],
        start=200,
        end=340,
        fill=CYAN,
        width=arc_w,
    )

    return img


for px in (192, 512):
    img = make_icon(px)
    path = os.path.join(OUT_DIR, f"icon-{px}.png")
    img.save(path, "PNG")
    print(f"Generated: {path}")

print("Done.")
