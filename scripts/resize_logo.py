#!/usr/bin/env python3
"""Resize MIFA ribbon logo and produce a small base64 PNG for HTML embedding."""
import base64, io, sys
from PIL import Image

SRC = "/home/z/my-project/download/mifa-brand-kit/mifa_brand_kit/assets/mifa-logo-ribbon.png"
OUT_PNG = "/home/z/my-project/scripts/mifa_logo_small.png"
OUT_B64 = "/home/z/my-project/scripts/mifa_logo_small.b64"

img = Image.open(SRC).convert("RGBA")
w, h = img.size
# target width 220px for header (crisp on retina at ~110px display)
target_w = 220
target_h = int(h * target_w / w)
img2 = img.resize((target_w, target_h), Image.LANCZOS)
img2.save(OUT_PNG, "PNG", optimize=True)

b64 = base64.b64encode(open(OUT_PNG, "rb").read()).decode()
open(OUT_B64, "w").write(b64)
print(f"orig={w}x{h} -> small={target_w}x{target_h}, png_bytes={len(b64)*3//4}, b64_chars={len(b64)}")
