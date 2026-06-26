"""
yamamap PWA アイコン生成 (192×192 / 512×512)
出力先: apps/yamamap/public/icons/
実行: uv run --with pillow tools/gen_yamamap_icons.py
"""

import os
from PIL import Image, ImageDraw

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "apps", "yamamap", "public", "icons")
os.makedirs(OUT_DIR, exist_ok=True)

BG = (11, 14, 20)        # #0b0e14
GREEN = (52, 211, 153)   # emerald-400 #34d399
GREEN_DIM = (110, 231, 183)  # emerald-300
WHITE = (255, 255, 255)


def make_icon(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), BG)
    d = ImageDraw.Draw(img)

    cx = size / 2
    base_y = size * 0.74   # 山の裾
    peak_y = size * 0.26   # 主峰の頂
    half_w = size * 0.34   # 裾の半幅

    # 主峰(大きい三角)
    main = [(cx, peak_y), (cx - half_w, base_y), (cx + half_w, base_y)]
    d.polygon(main, fill=GREEN)

    # 副峰(左にもう一つ小さい三角・奥行き)
    sub_peak_y = size * 0.40
    sub_cx = cx - half_w * 0.55
    sub_half = half_w * 0.55
    sub = [(sub_cx, sub_peak_y), (sub_cx - sub_half, base_y), (sub_cx + sub_half, base_y)]
    d.polygon(sub, fill=GREEN_DIM)
    # 主峰を前面に重ねて奥行きを出す
    d.polygon(main, fill=GREEN)

    # 雪冠(主峰の頂に白)
    snow_h = size * 0.12
    snow_w = half_w * (snow_h / (base_y - peak_y))
    snow = [
        (cx, peak_y),
        (cx - snow_w, peak_y + snow_h),
        (cx - snow_w * 0.4, peak_y + snow_h * 0.7),
        (cx, peak_y + snow_h),
        (cx + snow_w * 0.4, peak_y + snow_h * 0.7),
        (cx + snow_w, peak_y + snow_h),
    ]
    d.polygon(snow, fill=WHITE)

    return img


for px in (192, 512):
    img = make_icon(px)
    path = os.path.join(OUT_DIR, f"icon-{px}.png")
    img.save(path, "PNG")
    print(f"Generated: {path}")

print("Done.")
