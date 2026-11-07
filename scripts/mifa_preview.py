#!/usr/bin/env python3
"""Render all MIFA brand assets into one contact sheet for visual QA."""
import cairosvg, os
from PIL import Image, ImageDraw

ASSETS = "/home/z/my-project/download/mifa-brand-kit/mifa_brand_kit/assets"
USER_LOGO = "/home/z/my-project/upload/Minimalist Fintech Ribbon Logo.png"
OUT = "/tmp/render"
os.makedirs(OUT, exist_ok=True)

def render_svg(name, width=360, bg="#FFFFFF"):
    out = os.path.join(OUT, name.replace(".svg", "") + ".png")
    cairosvg.svg2png(url=os.path.join(ASSETS, name), write_to=out,
                     output_width=width, background_color=bg)
    return out

# grid cells: (image_path, label)
items = []
items.append((render_svg("mifa-logo-latin.svg"), "logo-latin"))
items.append((render_svg("mifa-logo-persian.svg"), "logo-persian (Vazirmatn)"))
items.append((render_svg("mifa-symbol.svg"), "symbol"))
items.append((render_svg("mifa-logo-white.svg", bg="#252A34"), "logo-white / dark bg"))
items.append((render_svg("mifa-app-icon-512.svg", width=240), "app-icon-512"))
items.append((render_svg("mifa-favicon.svg", width=120), "favicon"))
items.append((render_svg("mifa-pattern.svg", width=280), "pattern"))
items.append((USER_LOGO, "USER png logo"))

icons = [f"icon-{n}.svg" for n in ["groceries","transport","home","bills","entertainment",
                                    "health","clothing","education","gifts","savings"]]
for n in icons:
    items.append((render_svg(n, width=120), n.replace("icon-","").replace(".svg","")))

# build sheet: 4 columns
COLS, CELL, PAD, LABEL_H = 4, 260, 24, 34
rows = (len(items) + COLS - 1) // COLS
W = COLS * CELL + (COLS + 1) * PAD
H = rows * (CELL + LABEL_H) + (rows + 1) * PAD
sheet = Image.new("RGB", (W, H), "#F5F5F5")
d = ImageDraw.Draw(sheet)

for i, (path, label) in enumerate(items):
    r, c = divmod(i, COLS)
    x = PAD + c * (CELL + PAD)
    y = PAD + r * (CELL + LABEL_H + PAD)
    # white card
    d.rectangle([x, y, x + CELL, y + CELL], fill="#FFFFFF", outline="#CCCCCC")
    img = Image.open(path).convert("RGBA")
    img.thumbnail((CELL - 28, CELL - 28))
    sheet.paste(img, (x + (CELL - img.width)//2, y + (CELL - img.height)//2), img)
    d.text((x + CELL//2, y + CELL + 8), label, fill="#333333", anchor="ma")

sheet.save("/tmp/render/mifa-sheet.png")
print("saved", sheet.size)
