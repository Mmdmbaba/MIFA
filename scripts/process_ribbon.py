#!/usr/bin/env python3
"""Process user's handmade ribbon logo into web variants:
- transparent background version (light mode)
- dark-mode variant (navy -> light gray)
- white rounded tile (universal, favicon / app icon)
Outputs to /home/z/my-project/public/brand/
"""
from PIL import Image, ImageDraw, ImageFilter
import os

SRC = "/home/z/my-project/upload/Minimalist Fintech Ribbon Logo.png"
OUT = "/home/z/my-project/public/brand"
os.makedirs(OUT, exist_ok=True)

img = Image.open(SRC).convert("RGB")
W, H = img.size  # 1254x1254

# ---------- 1) crop to content bounding box (non-white) ----------
px = img.load()
min_x, min_y, max_x, max_y = W, H, 0, 0
step = 3
for y in range(0, H, step):
    for x in range(0, W, step):
        r, g, b = px[x, y]
        if not (r > 240 and g > 240 and b > 240):
            if x < min_x: min_x = x
            if x > max_x: max_x = x
            if y < min_y: min_y = y
            if y > max_y: max_y = y
pad = 14
min_x = max(0, min_x - pad); min_y = max(0, min_y - pad)
max_x = min(W, max_x + pad); max_y = min(H, max_y + pad)
crop = img.crop((min_x, min_y, max_x, max_y))
cw, ch = crop.size
print("cropped:", crop.size)

# ---------- 2) white -> transparent with smooth alpha ----------
def white_to_transparent(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    data = []
    pxp = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = pxp[x, y]
            # distance from white
            d = 255 - min(r, g, b)
            if d < 12:
                data.append((r, g, b, 0))
            elif d < 40:
                # soft edge
                alpha = int(255 * (d - 12) / 28)
                data.append((r, g, b, alpha))
            else:
                data.append((r, g, b, 255))
    out = Image.new("RGBA", im.size)
    out.putdata(data)
    return out

transparent = white_to_transparent(crop)
transparent.save(f"{OUT}/ribbon.png")
print("ribbon.png saved")

# ---------- 3) dark variant: navy -> #EAEAEA ----------
def dark_variant(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    out = Image.new("RGBA", im.size)
    po = out.load()
    pp = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = pp[x, y]
            if a > 0:
                # navy: dark desaturated blue-ish
                if r < 90 and g < 100 and b < 130 and b >= r:
                    # keep antialiasing feel: lighten strongly
                    nr, ng, nb = 234, 234, 234
                    # blend by original darkness to preserve edges
                    lum = (r + g + b) / 3
                    t = max(0.0, min(1.0, (110 - lum) / 110))
                    nr = int(r * (1 - t) + 234 * t)
                    ng = int(g * (1 - t) + 234 * t)
                    nb = int(b * (1 - t) + 234 * t)
                    po[x, y] = (nr, ng, nb, a)
                else:
                    po[x, y] = (r, g, b, a)
            else:
                po[x, y] = (r, g, b, a)
    return out

dark = dark_variant(transparent)
dark.save(f"{OUT}/ribbon-dark.png")
print("ribbon-dark.png saved")

# ---------- 4) white rounded tile (universal icon) ----------
def make_tile(size=512, radius_ratio=0.22):
    S = size
    tile = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    # white rounded square
    mask = Image.new("L", (S, S), 0)
    d = ImageDraw.Draw(mask)
    r = int(S * radius_ratio)
    d.rounded_rectangle([0, 0, S - 1, S - 1], radius=r, fill=255)
    white = Image.new("RGBA", (S, S), (255, 255, 255, 255))
    tile = Image.composite(white, tile, mask)
    # paste logo centered at ~72% of tile
    logo_ratio = 0.74
    lw = int(S * logo_ratio)
    lh = int(ch * lw / cw)
    if lh > int(S * logo_ratio):
        lh = int(S * logo_ratio)
        lw = int(cw * lh / ch)
    logo = transparent.resize((lw, lh), Image.LANCZOS)
    lx, ly = (S - lw) // 2, (S - lh) // 2
    # soft shadow
    shadow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    alpha = logo.split()[3].point(lambda a: int(a * 0.18))
    sh = Image.new("RGBA", (lw + 40, lh + 40), (0, 0, 0, 0))
    sh.paste((37, 42, 52, 255), (20, 24, 20 + lw, 24 + lh), alpha)
    sh = sh.filter(ImageFilter.GaussianBlur(10))
    tile.alpha_composite(sh, (lx - 20, ly - 20))
    tile.alpha_composite(logo, (lx, ly))
    return tile

tile512 = make_tile(512)
tile512.save(f"{OUT}/ribbon-tile.png")
for s in (192, 180, 64, 48, 32, 16):
    t = tile512.resize((s, s), Image.LANCZOS)
    t.save(f"{OUT}/ribbon-tile-{s}.png")
print("tiles saved")

# favicon for the app root
tile512.resize((32, 32), Image.LANCZOS).save("/home/z/my-project/public/favicon.png")
tile512.resize((180, 180), Image.LANCZOS).save(f"{OUT}/ribbon-apple.png")
print("favicon.png + apple saved")
