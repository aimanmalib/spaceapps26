# SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
"""Demo deck (PRD H4, K8): render demo/slides.html to demo/demo.pdf, one 16:9 page per slide.

    python3 scripts/render_demo.py      # needs the Python `playwright` package + Chromium

Page size, slide limit and paths: config/media.json "deck". Exits 1 if the slide count is over the limit.
"""
import json
import os
import pathlib
import sys

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
DECK = json.loads((ROOT / "config" / "media.json").read_text(encoding="utf-8"))["deck"]


def main():
    src, out = ROOT / DECK["source"], ROOT / DECK["pdf"]
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": DECK["width_px"], "height": DECK["height_px"]})
        page.goto(src.as_uri(), wait_until="load")
        page.wait_for_function("() => [...document.images].every(i => i.complete && i.naturalWidth > 0)")
        slides = page.locator(".slide").count()
        page.pdf(path=str(out), width=f"{DECK['width_px']}px", height=f"{DECK['height_px']}px",
                 print_background=True, prefer_css_page_size=True)
        browser.close()
    print(f"{out.relative_to(ROOT)}: {slides} slides, {os.path.getsize(out)} bytes")
    if slides > DECK["max_slides"]:
        sys.exit(f"{slides} slides > {DECK['max_slides']}")


if __name__ == "__main__":
    main()
