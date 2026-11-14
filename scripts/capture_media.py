# SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
"""Gallery and demo-deck media (PRD H4, §8): real screenshots of the deployed site, nothing drawn or generated.

    python3 scripts/capture_media.py [base_url]          # needs the Python `playwright` package + Chromium, and Pillow for the GIF
    python3 scripts/capture_media.py --deck [base_url]   # only the demo-deck crops (config/media.json "deck_png")

Writes docs/media/<name>.png for every name in config/media.json "png", and docs/media/<gif name>.gif: the timeline
slider of the first card stepped across one lunar day. Settings (URL, viewport, frames) live in config/media.json.
"""
import io
import json
import os
import sys

from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CFG = json.load(open(os.path.join(ROOT, "config", "media.json"), encoding="utf-8"))
OUT = os.path.join(ROOT, "docs", "media")
TIMEOUT_MS = 30000


def open_compare(page, base):
    page.goto(base, wait_until="networkidle")
    page.locator(".card .answers").first.wait_for()
    page.wait_for_function("() => document.querySelectorAll('.card .answers').length >= 2")


def open_block(page, cls, ready_js):
    box = page.locator(".card").first.locator(cls)
    if not box.locator("details").first.evaluate("d => d.open"):  # first-card blocks may start open
        box.locator("summary").first.click()
    page.wait_for_function(ready_js, timeout=TIMEOUT_MS)
    page.wait_for_timeout(400)
    return box


def shot(target, name):
    path = os.path.join(OUT, f"{name}.png")
    target.screenshot(path=path)
    print(f"{name}.png {os.path.getsize(path)} bytes")


def viewport(name):
    """Viewport for one shot: config/media.json "viewports" entry, else the default."""
    return CFG.get("viewports", {}).get(name, CFG["viewport"])


def capture_png(browser, base):
    ctx = browser.new_context(viewport=viewport("compare"), device_scale_factor=CFG["scale"], locale=CFG["locale"])
    page = ctx.new_page()
    page.set_default_timeout(TIMEOUT_MS)
    open_compare(page, base)
    page.evaluate("y => window.scrollTo(0, y)", page.locator(".card").first.bounding_box()["y"] - 24)
    page.wait_for_timeout(300)
    shot(page, "compare")
    page.set_viewport_size(CFG["viewport"])
    page.wait_for_timeout(300)
    box = open_block(page, ".shifts", "() => document.querySelector('.card .shifts-body')?.innerText.includes('km north')")
    shot(box, "small-shifts")
    box.locator("summary").click()
    box = open_block(page, ".map2d", "() => document.querySelector('.card .map-canvas')")
    shot(box, "map-2d")
    box.locator("summary").click()
    box = open_block(page, ".surface3d", "() => document.querySelector('.card .surf-body canvas, .card .surf-body svg')")
    shot(box, "surface-3d")
    page.set_viewport_size(viewport("validation"))
    page.goto(base.rstrip("/") + "/validation.html", wait_until="networkidle")
    page.locator("#validation table").first.wait_for()
    shot(page, "validation")
    ctx.close()


def union_clip(page, selectors, pad):
    """One clip rectangle (CSS px, page coordinates) around the first match of every selector, padded."""
    boxes = []
    for sel in selectors:
        page.locator(sel).first.scroll_into_view_if_needed()
        b = page.locator(sel).first.bounding_box()
        y = b["y"] + page.evaluate("window.scrollY")
        boxes.append((b["x"], y, b["x"] + b["width"], y + b["height"]))
    x0, y0 = min(b[0] for b in boxes) - pad, min(b[1] for b in boxes) - pad
    x1, y1 = max(b[2] for b in boxes) + pad, max(b[3] for b in boxes) + pad
    return {"x": max(0, x0), "y": max(0, y0), "width": x1 - max(0, x0), "height": y1 - max(0, y0)}


def capture_deck(browser, base):
    """Readable crops for the demo deck: each entry of config/media.json "deck_png" = name + selectors whose union is shot."""
    d = CFG["deck_png"]
    ctx = browser.new_context(viewport=d["viewport"], device_scale_factor=CFG["scale"], locale=CFG["locale"])
    page = ctx.new_page()
    page.set_default_timeout(TIMEOUT_MS)
    open_compare(page, base)
    page.wait_for_timeout(400)
    for item in d["shots"]:
        page.set_viewport_size(item.get("viewport", d["viewport"]))
        page.wait_for_timeout(400)
        if item.get("open"):
            open_block(page, item["open"], item["ready"])
        clip = union_clip(page, item["selectors"], d["pad"])
        path = os.path.join(OUT, f"{item['name']}.png")
        page.screenshot(path=path, clip=clip, full_page=True)
        print(f"{item['name']}.png {os.path.getsize(path)} bytes, {round(clip['width'])} x {round(clip['height'])} css px")
    ctx.close()


def capture_gif(browser, base):
    from PIL import Image  # only this step needs Pillow

    g = CFG["gif"]
    ctx = browser.new_context(viewport=CFG["viewport"], device_scale_factor=g["scale"], locale=CFG["locale"])
    page = ctx.new_page()
    page.set_default_timeout(TIMEOUT_MS)
    open_compare(page, base)
    card = page.locator(".card").first
    card.locator("select").select_option(g["site"])
    rng = card.locator(".tl input[type=range]")
    top = float(rng.get_attribute("max"))
    # Crop each frame to the card from its top to the end of the timeline controls.
    cb, tb = card.bounding_box(), card.locator(".tl-controls").bounding_box()
    crop_h = round((tb["y"] + tb["height"] - cb["y"] + 16) * g["scale"])
    frames = []
    for i in range(g["frames"]):
        before = card.locator(".card-result").inner_text()
        rng.evaluate("(r, v) => { r.value = String(v); r.dispatchEvent(new Event('input', {bubbles: true})); }",
                     round(top * i / (g["frames"] - 1)))
        if i:
            page.wait_for_function("([el, b]) => el.innerText !== b", arg=[card.locator(".card-result").element_handle(), before])
        page.wait_for_timeout(120)
        frames.append(Image.open(io.BytesIO(card.screenshot())).convert("RGB").crop((0, 0, round(cb["width"] * g["scale"]), crop_h)))
    pal = [f.quantize(colors=128, method=Image.Quantize.MEDIANCUT) for f in frames]
    path = os.path.join(OUT, f"{g['name']}.gif")
    pal[0].save(path, save_all=True, append_images=pal[1:], duration=g["frame_ms"], loop=0, optimize=True)
    print(f"{g['name']}.gif {os.path.getsize(path)} bytes, {len(pal)} frames")
    ctx.close()


def main():
    args = [a for a in sys.argv[1:] if a != "--deck"]
    deck_only = "--deck" in sys.argv[1:]
    base = args[0] if args else CFG["base_url"]
    os.makedirs(OUT, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            if not deck_only:
                capture_png(browser, base)
                capture_gif(browser, base)
            capture_deck(browser, base)
        finally:
            browser.close()
    big = [f for f in os.listdir(OUT) if os.path.getsize(os.path.join(OUT, f)) > CFG["max_bytes"]]
    if big:
        sys.exit(f"over {CFG['max_bytes']} bytes: {big}")


if __name__ == "__main__":
    main()
