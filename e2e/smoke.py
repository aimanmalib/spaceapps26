# SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
"""Browser smoke test against a deployed copy of the site (PRD H1).

    python3 e2e/smoke.py https://example.org/      # needs the Python `playwright` package + its browsers

Profiles: Chromium desktop 1280 px, Chromium 320 px, WebKit iPhone 13.
On each: the compare tool renders answers, the site select and the time input
update them, own coordinates (item b) give answers, "add" makes one more card, technical details open, the validation
page shows its numbers; zero console errors, zero requests to other hosts,
no horizontal overflow. Prints one line per profile; exit 1 on any failure.
Screenshots go to $AUTOPILOT_BUKTI_DIR (or $SMOKE_SHOTS) when set.
"""
import os
import sys
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright

PROFILES = [
    ("chromium-1280", "chromium", {"viewport": {"width": 1280, "height": 800}}),
    ("chromium-320", "chromium", {"viewport": {"width": 320, "height": 640}}),
    ("webkit-iphone13", "webkit", "iPhone 13"),
]
TIMEOUT_MS = 15000
# Sites with a terrain skyline in data/horizon/ (item j); every other site must say "ideal sphere horizon".
TERRAIN_SITES = {"im-1", "im-2"}


def no_overflow(page):
    return page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth")


# Item k/l tables: a word or number split across two lines inside a cell (e.g. "15.0|0°", "Eart|h") reads wrong.
SPLIT_WORDS_JS = """sel => {
  const out = [];
  for (const cell of document.querySelectorAll(sel)) {
    const walk = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT);
    for (let node = walk.nextNode(); node; node = walk.nextNode()) {
      for (const m of node.data.matchAll(/\\S+/g)) {
        const r = document.createRange();
        r.setStart(node, m.index);
        r.setEnd(node, m.index + m[0].length);
        const tops = new Set([...r.getClientRects()].filter(b => b.width > 0).map(b => Math.round(b.top)));
        if (tops.size > 1) out.push(m[0]);
      }
    }
  }
  return out;
}"""


def split_words(page, sel):
    return page.evaluate(SPLIT_WORDS_JS, sel)


def answers(page, n):
    return page.locator(".card").nth(n).locator(".card-result").inner_text()


def own_coordinates(page, check):
    """Item b: choose own coordinates, type a point, get answers; a bad latitude gives a message, not answers."""
    card = page.locator(".card").first
    card.locator("select").select_option("custom")
    fields = card.locator(".custom-fields")
    fields.wait_for(state="visible")
    lat, lon = fields.locator("input").nth(0), fields.locator("input").nth(1)
    commit = "e => e.blur()"  # a real commit, so no late native change event re-renders the card later
    lat.fill("95")
    lat.evaluate(commit)
    card.locator(".card-result .note-warn").wait_for()
    check(lat.get_attribute("aria-invalid") == "true", "own coordinates: bad latitude marked (b)")
    lat.fill("-89.45")
    lat.evaluate(commit)
    lon.fill("222.69")
    lon.evaluate(commit)
    page.wait_for_function("() => document.querySelector('.glance-table')?.innerText.includes('222.69')")
    card.locator(".card-result .answers").wait_for()
    check(card.locator(".horizon-kind").inner_text().startswith("Horizon: ideal sphere"), "own coordinates: ideal sphere horizon (b)")
    check(card.locator(".tl:not([hidden]) .tl-svg .tl-now").count() == 1, "own coordinates: timeline drawn (b, g)")
    check("Own point" in page.locator(".glance-table").inner_text(), "own coordinates: side-by-side table names the point (b)")


def small_shifts(page, check):
    """Item l: open the small-shifts block on a terrain site; time rows at once, nearby-point rows from the browser engine."""
    card = page.locator(".card").first
    card.locator("select").select_option("im-2")
    box = card.locator(".shifts")
    box.wait_for(state="visible")
    box.locator("summary").click()
    page.wait_for_function("() => document.querySelector('.card .shifts-body')?.innerText.includes('km north')", timeout=30000)
    rows = box.locator(".shift-table tbody tr").count()
    check(rows == 9, f"small shifts: chosen + 4 time + 4 nearby rows (l), got {rows}")
    check("shifts change" in box.locator(".shift-sum").inner_text(), "small shifts: count of changed answers (l)")
    check(box.evaluate("e => e.scrollWidth <= e.clientWidth"), "small shifts: table fits the card (l)")
    bad = split_words(page, ".card .shift-table th, .card .shift-table td")
    check(not bad, f"small shifts: no word split across lines (l): {bad[:4]}")
    card.locator("select").select_option("apollo-11")
    page.wait_for_function("() => document.querySelector('.card .shifts-body')?.innerText.includes('ideal sphere')")
    check(box.locator(".shift-table tbody tr").count() == 5, "small shifts: sphere site = time rows only (l)")


def moon_earth(page, check, shots, name):
    """Item k: open the Moon-and-Earth block; quoted values, measured Sun/Earth motion, NASA quote; follows the scenario."""
    card = page.locator(".card").first
    box = card.locator(".moonearth")
    box.wait_for(state="visible")
    box.locator("summary").click()
    page.wait_for_function("() => document.querySelector('.card .me-body')?.innerText.includes('per hour')")
    check(box.locator(".me-table tbody tr").count() == 4, "Moon and Earth: 4 rows (k)")
    text = box.inner_text()
    check("29.53 days" in text and "15.00° per hour" in text and "edge of the lunar sphere" in text, "Moon and Earth: quoted + measured values (k)")
    before = box.locator(".me-earth").inner_text()
    card.locator("select").select_option("im-2")
    page.wait_for_function("b => document.querySelector('.card .me-earth')?.innerText !== b", arg=before)
    check(box.evaluate("e => e.scrollWidth <= e.clientWidth"), "Moon and Earth: table fits the card (k)")
    bad = split_words(page, ".card .me-table th, .card .me-table td")
    check(not bad, f"Moon and Earth: no word or number split across lines (k): {bad[:4]}")
    if shots:
        box.screenshot(path=os.path.join(shots, f"smoke-{name}-moon-earth.png"))


def run_profile(p, name, engine, ctx_opts, base, shots):
    browser = getattr(p, engine).launch()
    opts = p.devices[ctx_opts] if isinstance(ctx_opts, str) else ctx_opts
    ctx = browser.new_context(**opts)
    page = ctx.new_page()
    page.set_default_timeout(TIMEOUT_MS)
    origin = urlsplit(base).netloc
    errors, foreign = [], []
    page.on("console", lambda m: m.type == "error" and errors.append(m.text))
    page.on("pageerror", lambda exc: errors.append(str(exc)))
    page.on("request", lambda r: urlsplit(r.url).scheme in ("http", "https")
            and urlsplit(r.url).netloc != origin and foreign.append(r.url))
    fails = []

    def check(ok, what):
        if not ok:
            fails.append(what)

    try:
        page.goto(base, wait_until="networkidle")
        page.locator(".card .answers").first.wait_for()
        page.wait_for_function("document.querySelectorAll('.card .answers').length === document.querySelectorAll('.card').length")
        n0 = page.locator(".card").count()
        check(page.locator(".answers .answer").count() == 2 * n0, "power + comm answer on every card")
        check(page.locator(".answers .answer-deg").count() == 2 * n0
              and page.locator(".answers .answer-when").count() == 2 * n0, "elevation + time to set/rise on every answer (f, e)")
        check(page.locator(".glance-table thead th").count() == n0, "side-by-side table: one column per scenario (c)")
        check(page.locator(".card .horizon-kind").count() == n0, "every card says which horizon it uses (j)")
        terrain = page.locator(".card").evaluate_all(
            "cs => cs.map(c => [c.querySelector('select').value, !!c.querySelector('.sky-terrain')])")
        check(all(has == (site in TERRAIN_SITES) for site, has in terrain), f"terrain skyline only for LOLA sites: {terrain}")
        before = answers(page, 0)
        sel = page.locator(".card select").first
        options = sel.locator("option").evaluate_all("os => os.map(o => o.value)")
        options = [o for o in options if o != "custom"]
        sel.select_option(options[-1] if sel.input_value() != options[-1] else options[0])
        page.wait_for_function("b => document.querySelector('.card .card-result').innerText !== b", arg=before)
        before = answers(page, 0)
        tinput = page.locator(".card input[type=datetime-local]").first
        old_t = tinput.input_value()
        tinput.fill(old_t[:8] + ("20" if old_t[8:10] != "20" else "21") + old_t[10:])
        tinput.dispatch_event("change")
        page.wait_for_function("b => document.querySelector('.card .card-result').innerText !== b", arg=before)
        page.locator(".add").click()
        page.locator(".card").nth(n0).locator(".answers").wait_for()
        check(page.locator(".card").count() == n0 + 1, "add makes one more card")
        page.wait_for_function("n => document.querySelectorAll('.glance-table thead th').length === n", arg=n0 + 1)
        check(page.locator(".card .tl:not([hidden]) .tl-svg .tl-now").count() == n0 + 1, "timeline of one lunar day on every card (g)")
        before_t = tinput.input_value()
        scrub = page.locator(".card .tl input[type=range]").first
        scrub.focus()
        scrub.press("End")
        page.wait_for_function("b => document.querySelector('.card input[type=datetime-local]').value !== b", arg=before_t)
        check(page.locator(".card .tl").first.locator("input[type=range]").evaluate("r => r.value === r.max"), "timeline scrubber moves the card time (g)")
        scrub.press("Home")
        before_t = tinput.input_value()
        play = page.locator(".card .tl-play").first
        play.click()
        page.wait_for_function("b => document.querySelector('.card input[type=datetime-local]').value !== b", arg=before_t)
        play.click()
        check(play.get_attribute("aria-pressed") == "false", "Play advances the time and Pause stops it (g)")
        page.emulate_media(reduced_motion="reduce")
        page.wait_for_function("() => [...document.querySelectorAll('.tl-play')].every(b => b.hidden)")
        page.emulate_media(reduced_motion="no-preference")
        small_shifts(page, check)
        moon_earth(page, check, shots, name)
        own_coordinates(page, check)
        page.locator(".card details.tech summary").first.click()
        check(page.locator(".card details.tech").first.evaluate("d => d.open"), "technical details open")
        page.evaluate("window.scrollTo(0, 600)")
        check(no_overflow(page), "compare page: no horizontal overflow")
        check(page.locator(".glance-scroll").evaluate("e => e.scrollWidth <= e.clientWidth || getComputedStyle(e).overflowX === 'auto'"),
              "side-by-side table scrolls inside its own box")
        if shots:
            page.screenshot(path=os.path.join(shots, f"smoke-{name}-compare.png"), full_page=True)

        page.goto(base.rstrip("/") + "/validation.html", wait_until="networkidle")
        page.locator("#validation table").first.wait_for()
        text = page.locator("#validation").inner_text()
        check("°" in text and page.locator("#validation tbody tr").count() >= 20, "validation numbers + ≥ 20 pairs shown")
        check("PGDA" in text and "%" in text, "terrain check against NASA PGDA shown (H9 b)")
        check(no_overflow(page), "validation page: no horizontal overflow")
        if shots:
            tall = page.evaluate("document.documentElement.scrollHeight") > 30000  # WebKit screenshot limit 32767 px
            page.screenshot(path=os.path.join(shots, f"smoke-{name}-validation.png"), full_page=not tall)
    except Exception as exc:  # noqa: BLE001 — a smoke run reports, it does not crash
        fails.append(f"{type(exc).__name__}: {str(exc).splitlines()[0]}")
    finally:
        browser.close()
    check(not errors, f"console errors: {errors[:3]}")
    check(not foreign, f"requests to other hosts: {foreign[:3]}")
    return fails


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    base = sys.argv[1]
    shots = os.environ.get("SMOKE_SHOTS") or os.environ.get("AUTOPILOT_BUKTI_DIR") or ""
    bad = 0
    with sync_playwright() as p:
        for name, engine, ctx_opts in PROFILES:
            fails = run_profile(p, name, engine, ctx_opts, base, shots)
            bad += bool(fails)
            print(f"smoke {name}: {'PASS' if not fails else 'FAIL — ' + '; '.join(fails)}", flush=True)
    print(f"smoke {base}: {'PASS' if not bad else f'FAIL ({bad} profile(s))'}")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
