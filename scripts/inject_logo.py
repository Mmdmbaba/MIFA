#!/usr/bin/env python3
"""Inject base64 ribbon logo into the HTML report and validate the result."""
import base64, re, sys

HTML = "/home/z/my-project/download/mifa-hosting-research.html"
B64 = "/home/z/my-project/scripts/mifa_logo_small.b64"

b64 = open(B64).read().strip()
html = open(HTML, encoding="utf-8").read()

count = html.count("__MIFA_LOGO_B64__")
html = html.replace("__MIFA_LOGO_B64__", b64)
open(HTML, "w", encoding="utf-8").write(html)

# validation
leftover = "PLACEHOLDER_LEFT" if "__MIFA_LOGO_B64__" in html else "no-placeholder-left"
checks = {
    "logo_injected": count,
    "has_doctype": html.lstrip().lower().startswith("<!doctype html"),
    "rtl": 'dir="rtl"' in html,
    "vazirmatn": "Vazirmatn" in html,
    "brand_teal": "#08D9D6" in html,
    "sections": len(re.findall(r'<section', html)),
    "tables": len(re.findall(r'<table', html)),
    "no_unclosed_b64_placeholder": leftover,
    "size_kb": len(html.encode()) // 1024,
}
for k, v in checks.items():
    print(f"{k}: {v}")
