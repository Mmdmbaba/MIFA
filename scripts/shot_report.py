#!/usr/bin/env python3
"""Screenshot the MIFA hosting research HTML for visual verification."""
import asyncio
from playwright.async_api import async_playwright

HTML = "/home/z/my-project/download/mifa-hosting-research.html"
OUT = "/tmp/render"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1280, "height": 900})
        await page.goto(f"file://{HTML}")
        await page.wait_for_timeout(2500)  # let web font load
        h = await page.evaluate("document.body.scrollHeight")
        print(f"page_height={h}px")
        # full page screenshot (downscaled by Read automatically)
        await page.screenshot(path=f"{OUT}/full.png", full_page=True)
        # section shots
        for i, sel in enumerate(["#verdict", "#compare", "#api", "#arch", "footer"], 1):
            el = page.locator(sel)
            await el.scroll_into_view_if_needed()
            await page.wait_for_timeout(300)
            await page.screenshot(path=f"{OUT}/sec{i}.png")
        await browser.close()
        print("screenshots saved")

asyncio.run(main())
