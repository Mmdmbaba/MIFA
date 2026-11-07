#!/usr/bin/env python3
"""Stamp Persian page numbers on body pages (skip cover page 1) + set author metadata.
Scheme per pagination.md: cover = hidden page 1; body pages show Arabic numbers starting at 1.
"""
import io
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

SRC = "/home/z/my-project/download/hesab-report/گزارش-حسابداری-شخصی-ایران.pdf"
FONT = "/home/z/my-project/download/hesab-report/assets/fonts/Vazirmatn-Regular.ttf"

FA_DIGITS = {"0":"۰","1":"۱","2":"۲","3":"۳","4":"۴","5":"۵","6":"۶","7":"۷","8":"۸","9":"۹"}
def fa(n: int) -> str:
    return "".join(FA_DIGITS[c] for c in str(n))

pdfmetrics.registerFont(TTFont("Vazir", FONT))

reader = PdfReader(SRC)
n = len(reader.pages)
w = float(reader.pages[0].mediabox.width)
h = float(reader.pages[0].mediabox.height)
print(f"pages={n} size={w:.0f}x{h:.0f}")

writer = PdfWriter()
for i, page in enumerate(reader.pages):
    if i == 0:  # cover — no visible number
        writer.add_page(page)
        continue
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=(w, h))
    c.setFont("Vazir", 9)
    c.setFillColorRGB(0.37, 0.42, 0.39)  # muted
    c.drawCentredString(w / 2, 20, fa(i))  # body starts at 1 on physical page 2
    c.save()
    buf.seek(0)
    overlay = PdfReader(buf).pages[0]
    page.merge_page(overlay)
    writer.add_page(page)

writer.add_metadata({
    "/Title": "حسابداری شخصی در ایران — گزارش تحقیق بازار و نقشه راه محصول",
    "/Author": "Z.ai",
    "/Creator": "Z.ai",
    "/Subject": "تحلیل ابزارهای حسابداری شخصی ایرانی، شکاف‌های بازار و نقشه راه هشت‌فازی برند و وب‌اپ",
})
with open(SRC, "wb") as f:
    writer.write(f)
print("stamped + metadata OK")
