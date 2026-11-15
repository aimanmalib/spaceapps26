# SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
"""Browser smoke test against a deployed copy of the site (PRD H1).

    python3 e2e/smoke.py https://example.org/      # needs the Python `playwright` package + its browsers

Profiles: Chromium desktop 1280 px, Chromium 320 px, WebKit iPhone 13.
On each: the compare tool renders answers, the site select and the time input
update them, the step buttons and "If the date moves" table (sequential comparison) work, own coordinates (item b) give answers, the 2D map (item h) and 3D surface (item i) draw, "add" makes one more card, technical details open, the validation
page shows its numbers, the Play page plays one round, About lists items a–l and limitations, Data sources lists the frozen files;
the first answers of the first card fit the first screen (P4f), zero console errors, zero requests to other hosts,
no horizontal overflow. Prints one line per profile; exit 1 on any failure.
Screenshots go to $AUTOPILOT_BUKTI_DIR (or $SMOKE_SHOTS) when set.
"""
from datetime import datetime, timezone
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
# Direct link to the "one kilometre" case (README, deck slide 4, form text).
ONE_KM_QUERY = "?s=im-2,2026-11-14T00:00"
# Sites with a terrain skyline in data/horizon/ (item j); every other site must say "ideal sphere horizon".
TERRAIN_SITES = {"im-1", "im-2"}
# First screen (P4f): on a 1280 x 900 desktop window both large numbers of the first card end inside it; on an
# iPhone 13 (664 px tall) the first answer of the first card starts inside it. Positions are page coordinates at scroll 0.
FIRST_SCREEN = {"chromium-1280": (".answer-comm .answer-deg", "bottom", 900), "webkit-iphone13": (".answer-power", "top", 664)}


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


def open_box(box):
    """Open a per-card <details> block; on the first card some start open (config/view.json "first_card")."""
    if not box.locator("details").first.evaluate("d => d.open"):
        box.locator("summary").first.click()


def answers(page, n):
    return page.locator(".card").nth(n).locator(".card-result").inner_text()


def own_coordinates(page, check):
    """Item b: choose own coordinates, type a point, get answers; a bad latitude gives a message, not answers."""
    card = page.locator(".card").first
    card.locator("select[id$='-site']").select_option("custom")
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


def one_year(page, check):
    """Item d: the first card's timeline switches to the whole one-year table and back."""
    tl = page.locator(".card .tl").first
    tl.locator(".tl-range-btn[data-range=year]").click()
    page.wait_for_function("() => document.querySelector('.card .tl-range-btn[data-range=year]').getAttribute('aria-pressed') === 'true'")
    page.wait_for_function("() => !document.querySelector('.card .tl-year-share').hidden")
    pts = tl.locator(".tl-svg .tl-sun").get_attribute("points") or ""
    days = tl.locator("input[type=range]").evaluate("r => +r.max / 1440")
    share = tl.locator(".tl-year-share").inner_text()
    check(len(pts.split()) > 100 and days > 360 and " %" in share, f"one-year timeline drawn with caption (d): {days:.0f} days, '{share[:60]}'")
    tl.locator(".tl-range-btn[data-range=day]").click()
    page.wait_for_function("() => document.querySelector('.card .tl-year-share').hidden")
    check(tl.locator("input[type=range]").evaluate("r => +r.max / 1440 < 31"), "timeline back to one lunar day (d)")


def small_shifts(page, check):
    """Item l: open the small-shifts block on a terrain site; time rows at once, nearby-point rows from the browser engine."""
    card = page.locator(".card").first
    card.locator("select[id$='-site']").select_option("im-2")
    box = card.locator(".shifts")
    box.wait_for(state="visible")
    open_box(box)
    page.wait_for_function("() => document.querySelector('.card .shifts-body')?.innerText.includes('km north')", timeout=30000)
    rows = box.locator(".shift-table tbody tr").count()
    check(rows == 9, f"small shifts: chosen + 4 time + 4 nearby rows (l), got {rows}")
    check("shifts change" in box.locator(".shift-sum").inner_text(), "small shifts: count of changed answers (l)")
    check(box.evaluate("e => e.scrollWidth <= e.clientWidth"), "small shifts: table fits the card (l)")
    bad = split_words(page, ".card .shift-table th, .card .shift-table td")
    check(not bad, f"small shifts: no word split across lines (l): {bad[:4]}")
    card.locator("select[id$='-site']").select_option("apollo-11")
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
    card.locator("select[id$='-site']").select_option("im-2")
    page.wait_for_function("b => document.querySelector('.card .me-earth')?.innerText !== b", arg=before)
    check(box.evaluate("e => e.scrollWidth <= e.clientWidth"), "Moon and Earth: table fits the card (k)")
    bad = split_words(page, ".card .me-table th, .card .me-table td")
    check(not bad, f"Moon and Earth: no word or number split across lines (k): {bad[:4]}")
    if shots:
        box.screenshot(path=os.path.join(shots, f"smoke-{name}-moon-earth.png"))


def map_2d(page, check, shots, name):
    """Item h: open the map block on a LOLA site; heights drawn, site + Sun/Earth directions + skyline; other sites say no map."""
    card = page.locator(".card").first
    card.locator("select[id$='-site']").select_option("im-2")
    box = card.locator(".map2d")
    box.wait_for(state="visible")
    open_box(box)
    page.wait_for_function("() => document.querySelector('.card .map-canvas')")
    drawn = box.locator(".map-canvas").evaluate(
        "c => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;"
        " let n = 0; for (let i = 3; i < d.length; i += 4) n += d[i] > 0; return n / (d.length / 4); }")
    check(drawn > 0.9, f"map: heights drawn on the canvas (h): {drawn:.2f}")
    check(box.locator(".map-ray").count() == 2 and box.locator(".map-site").count() == 1, "map: site + Sun/Earth directions (h)")
    check(box.locator(".map-sky").count() > 10, "map: terrain skyline points (h)")
    check(box.evaluate("e => e.scrollWidth <= e.clientWidth"), "map: fits the card (h)")
    if shots:
        box.screenshot(path=os.path.join(shots, f"smoke-{name}-map.png"))
    card.locator("select[id$='-site']").select_option("apollo-11")
    page.wait_for_function("() => document.querySelector('.card .map-body')?.innerText.startsWith('No map')")
    card.locator("select[id$='-site']").select_option("im-2")


def surface_3d(page, check, shots, name):
    """Item i: open the 3D block on a LOLA site; surface drawn, slider turns it (keyboard), fits the card; other sites say no surface."""
    card = page.locator(".card").first
    card.locator("select[id$='-site']").select_option("im-2")
    box = card.locator(".surface3d")
    box.wait_for(state="visible")
    box.locator("summary").click()
    page.wait_for_function("() => document.querySelector('.card .surf-canvas')?.width > 0")
    canvas = box.locator(".surf-canvas")
    stats = ("c => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;"
             " let n = 0, s = 0; for (let i = 0; i < d.length; i += 4) { n += d[i + 3] > 0; s = (s * 31 + d[i] + d[i + 1]) % 1e9; }"
             " return [n / (d.length / 4), s]; }")
    drawn, sum0 = canvas.evaluate(stats)
    check(drawn > 0.3, f"surface: ground drawn on the canvas (i): {drawn:.2f}")
    value0 = box.locator(".surf-value").inner_text()
    box.locator(".surf-range").focus()
    step = int(box.locator(".surf-range").get_attribute("step"))
    start = int(box.locator(".surf-range").input_value())
    for _ in range(3):
        page.keyboard.press("ArrowRight")
        page.wait_for_timeout(150)
    page.wait_for_function("v => document.querySelector('.card .surf-value').innerText !== v", arg=value0)
    check(box.locator(".surf-range").evaluate("(r, [a, s]) => +r.value === a + 3 * s && document.activeElement === r", [start, step]),
          "surface: three key presses turn the view three steps, focus stays on the slider (i)")
    check(canvas.evaluate(stats)[1] != sum0, "surface: the slider turns the view (i)")
    check(box.evaluate("e => e.scrollWidth <= e.clientWidth"), "surface: fits the card (i)")
    if shots:
        box.screenshot(path=os.path.join(shots, f"smoke-{name}-surface.png"))
    card.locator("select[id$='-site']").select_option("apollo-11")
    page.wait_for_function("() => document.querySelector('.card .surf-body')?.innerText.startsWith('No 3D')")
    card.locator("select[id$='-site']").select_option("im-2")


def sequence(page, check):
    """Sequential comparison: keyboard step to the next site (date kept), a day later (site kept); date table on the first card."""
    card = page.locator(".card").first
    sel, tinput = card.locator("select[id$='-site']"), card.locator("input[type=datetime-local]")
    site0, time0, before = sel.input_value(), tinput.input_value(), answers(page, 0)
    card.locator(".step-site-next").focus()
    page.keyboard.press("Enter")
    page.wait_for_function("b => document.querySelector('.card .card-result').innerText !== b", arg=before)
    check(sel.input_value() != site0 and tinput.input_value() == time0, "step: next site, same date (sequential)")
    before = answers(page, 0)
    card.locator(".step-time-next").click()
    page.wait_for_function("t => document.querySelector('.card input[type=datetime-local]').value !== t", arg=time0)
    day = (datetime.fromisoformat(tinput.input_value()) - datetime.fromisoformat(time0)).total_seconds() / 3600
    check(sel.input_value() != site0 and day > 0, f"step: later date, same site (sequential), +{day:.0f} h")
    box = card.locator(".sequence")
    check(box.locator("details").evaluate("d => d.open"), "date table open on the first card (sequential)")
    page.wait_for_function("() => document.querySelectorAll('.card .seq-table tbody tr').length > 2")
    rows = box.locator(".seq-table tbody tr").count()
    check(rows > 2 and "Solar power possible on" in box.locator(".seq-sum").inner_text(), f"date table rows + summary (sequential): {rows}")
    check(box.evaluate("e => e.scrollWidth <= e.clientWidth"), "date table fits the card (sequential)")
    second = page.locator(".card").nth(1).locator(".sequence details")
    check(not second.evaluate("d => d.open"), "date table folded on the other cards (sequential)")
    card.locator(".step-site-prev").click()
    page.wait_for_function("s => document.querySelector('.card select').value === s", arg=site0)
    card.locator(".step-time-prev").click()
    page.wait_for_function("t => document.querySelector('.card input[type=datetime-local]').value === t", arg=time0)


def windows(page, check):
    """Mission window finder: open on the first card, windows listed, "Use this start time" sets the card time; folded elsewhere."""
    card = page.locator(".card").first
    tinput = card.locator("input[type=datetime-local]")
    time0 = tinput.input_value()
    box = card.locator(".mission")
    check(box.locator("details").evaluate("d => d.open"), "next windows open on the first card (window finder)")
    page.wait_for_function("() => document.querySelectorAll('.card .win-list .win-item, .card .win-none').length > 0")
    items = box.locator(".win-item").count()
    check(items > 0 and "Sun and Earth both above the horizon in" in box.locator(".win-sum").inner_text(),
          f"windows listed + share line (window finder): {items}")
    box.locator(".win-min").select_option(box.locator(".win-min option").last.get_attribute("value"))
    page.wait_for_function("() => document.querySelector('.card .win-min').value === document.querySelector('.card .win-min option:last-child').value")
    check(box.locator(".win-item, .win-none").count() > 0, "longer length re-lists (window finder)")
    box.locator(".win-min").select_option(box.locator(".win-min option").first.get_attribute("value"))
    use = box.locator(".win-use").first
    want = int(use.get_attribute("data-ms"))
    use.focus()
    page.keyboard.press("Enter")
    page.wait_for_function("t => document.querySelector('.card input[type=datetime-local]').value !== t", arg=time0)
    got = datetime.fromisoformat(tinput.input_value()).replace(tzinfo=timezone.utc).timestamp() * 1000
    check(abs(got - want) < 60_000, "Use this start time sets the card time (window finder)")
    check(box.evaluate("e => e.scrollWidth <= e.clientWidth"), "window list fits the card (window finder)")
    second = page.locator(".card").nth(1).locator(".mission details")
    check(not second.evaluate("d => d.open"), "next windows folded on the other cards (window finder)")
    tinput.fill(time0)
    tinput.dispatch_event("change")
    page.wait_for_function("t => document.querySelector('.card input[type=datetime-local]').value === t", arg=time0)


def share(page, check, base):
    """Shareable link + verdict + Now: the "one kilometre" link opens IM-2 at 2026-11-14 00:00; Copy link gives the same
    scenario back; Now sets every card to the current hour (inside the data) or is disabled with a reason; a link that
    cannot be read keeps the default scenarios and says so."""
    page.goto(base.rstrip("/") + "/" + ONE_KM_QUERY, wait_until="networkidle")
    page.locator(".card .answers").first.wait_for()
    check(page.locator(".card").count() == 1 and page.locator(".card select[id$='-site']").first.input_value() == "im-2"
          and page.locator(".card input[type=datetime-local]").first.input_value() == "2026-11-14T00:00", "link opens the one-kilometre case (share)")
    v = page.locator(".verdicts li").first.inner_text()
    check(v.startswith("Scenario 1:") and "IM-2" in v and "direct line to Earth" in v, f"verdict sentence above the table (share): {v[:80]}")
    page.locator(".share-copy").click()
    page.locator(".share-field:not([hidden])").wait_for()
    check(page.locator(".share-url").input_value().endswith(ONE_KM_QUERY), "Copy link gives the same scenario back (share)")
    check(page.locator(".share-status").inner_text() != "", "copy result is announced (share)")
    now = page.locator(".share-now")
    if now.is_disabled():
        check(page.locator(".share-now-why").is_visible(), "Now disabled with a visible reason (share)")
    else:
        now.click()
        want = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:00")
        page.wait_for_function("t => document.querySelector('.card input[type=datetime-local]').value === t", arg=want)
        page.locator(".card .answers").first.wait_for()
    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    check(no_overflow(page), "share controls: no horizontal overflow")
    page.goto(base.rstrip("/") + "/?s=nowhere,2026-11-14T00:00", wait_until="networkidle")
    page.locator(".card .answers").first.wait_for()
    check(page.locator(".card").count() >= 2 and "could not be read" in page.locator(".share-status").inner_text(),
          "unreadable link: default scenarios + visible notice (share)")


def play_game(page, check, base, shots, name):
    """Educational game (play.html): one round played with the keyboard-reachable radios; Check shows two marks, a
    computed reason, the horizon picture and a link that opens the same scenario in the tool; Next moves on."""
    page.goto(base.rstrip("/") + "/play.html", wait_until="networkidle")
    page.locator(".game-form").wait_for()
    check(page.locator(".game-q").count() == 2, "play: two yes/no questions")
    page.locator(".game-check").click()
    check(page.locator(".game-missing").is_visible(), "play: Check without answers asks for both")
    for q in ("sun", "earth"):
        page.locator(f".game-q input[name={q}][value=yes]").check()
    page.locator(".game-check").click()
    page.locator(".game-result:not([hidden]) .game-marks").wait_for()
    marks = page.locator(".game-mark").all_inner_texts()
    check(len(marks) == 2 and all("°" in m and "azimuth" in m for m in marks), f"play: two marks with a computed reason: {marks[:1]}")
    check(page.locator(".game-result .sky-svg").count() == 1, "play: horizon picture after Check")
    href = page.locator(".game-open").get_attribute("href")
    check(href.startswith("./?s="), f"play: link opens the scenario in the tool ({href})")
    check(no_overflow(page), "play page: no horizontal overflow")
    if shots:
        page.screenshot(path=os.path.join(shots, f"smoke-{name}-play.png"), full_page=True)
    page.locator(".game-next").click()
    page.wait_for_function("() => document.querySelector('.game-progress')?.innerText.startsWith('Round 2')")
    page.goto(base.rstrip("/") + "/" + href.lstrip("./"), wait_until="networkidle")
    page.locator(".card .answers").first.wait_for()
    check(page.locator(".card").count() == 1, "play: scenario link opens one card in the tool")


def teach_page(page, check, base, shots, name):
    """Page for teachers (teach.html): three steps, each with a link; the scenario links open the tool with the
    step's cards, and the game link opens the game. No answers in degrees are written on the page itself."""
    page.goto(base.rstrip("/") + "/teach.html", wait_until="networkidle")
    page.locator(".teach-step").first.wait_for()
    steps = page.locator(".teach-step").count()
    check(steps == 3, f"teach: three steps ({steps})")
    check("°" not in page.locator("#teach-steps").inner_text(), "teach: no answers written in the steps")
    check(page.locator("#teach-facts .me-table tbody tr").count() >= 3, "teach: Moon and Earth facts table")
    check(no_overflow(page), "teach page: no horizontal overflow")
    if shots:
        page.screenshot(path=os.path.join(shots, f"smoke-{name}-teach.png"), full_page=True)
    hrefs = page.locator(".teach-link a").evaluate_all("as => as.map(a => a.getAttribute('href'))")
    check(hrefs[0] == "./play.html", f"teach: step 1 opens the game ({hrefs[0]})")
    for href in hrefs[1:]:
        want = href.count("s=")
        page.goto(base.rstrip("/") + "/" + href.lstrip("./"), wait_until="networkidle")
        page.locator(".card .answers").first.wait_for()
        check(page.locator(".card").count() == want, f"teach: {href} opens {want} card(s) in the tool")


def masthead_photo(page, check):
    """P4r: the NASA photo loads with alt text where it is shown, the title text keeps clear of it, and title contrast >= 4.5:1."""
    r = page.evaluate("""() => {
      const img = document.querySelector('.masthead-photo'); const b = img.getBoundingClientRect();
      const lum = c => { const v = c.match(/[\\d.]+/g).slice(0, 3).map(x => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; });
                         return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
      const bg = lum(getComputedStyle(document.documentElement).backgroundColor);
      let overlap = false, contrast = 99;
      for (const el of document.querySelectorAll('.masthead .eyebrow, .masthead h1')) {
        const rg = document.createRange(); rg.selectNodeContents(el);
        for (const t of rg.getClientRects()) if (b.width && t.right > b.left && t.left < b.right && t.bottom > b.top && t.top < b.bottom) overlap = true;
        const f = lum(getComputedStyle(el).color); contrast = Math.min(contrast, (Math.max(f, bg) + 0.05) / (Math.min(f, bg) + 0.05));
      }
      return {shown: b.width > 0, loaded: img.complete && img.naturalWidth > 0, alt: img.alt, overlap, contrast};
    }""")
    if r["shown"]:
        check(r["loaded"] and "NASA" in r["alt"], f"masthead photo loaded with alt text ({r['alt'][:40]!r})")
    check(not r["overlap"], "masthead: title text clear of the photo")
    check(r["contrast"] >= 4.5, f"masthead: title contrast {r['contrast']:.1f}:1 >= 4.5:1")


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
        first = page.locator(".card").first
        check(page.evaluate("() => !!(document.querySelector('.cards').compareDocumentPosition(document.querySelector('.glance')) & 4)"),
              "first screen: scenario cards before the side-by-side table")
        check(not page.locator("details.how").evaluate("d => d.open"), "first screen: explanation folded in 'How to read this'")
        check(first.locator(".shifts details").evaluate("d => d.open"), "first screen: small shifts open on the first card")
        if name in FIRST_SCREEN:
            sel, edge, limit = FIRST_SCREEN[name]
            pos = first.locator(sel).evaluate("(e, k) => e.getBoundingClientRect()[k] + window.scrollY", edge)
            check(pos <= limit, f"first screen: {sel} {edge} {pos:.0f} px <= {limit} px")
        masthead_photo(page, check)
        wide = page.evaluate("() => window.innerWidth >= 1024")
        check(first.locator(".map2d details").evaluate("d => d.open") == wide, "first screen: 2D map open only on wide windows")
        near = page.locator(".card").evaluate_all(
            "cs => cs.map(c => [c.querySelector('select').value, !!c.querySelector('.sky-near')])")
        check(all(has == (site in TERRAIN_SITES) for site, has in near), f"near-horizon strip only for LOLA sites: {near}")
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
        one_year(page, check)
        small_shifts(page, check)
        sequence(page, check)
        windows(page, check)
        moon_earth(page, check, shots, name)
        map_2d(page, check, shots, name)
        surface_3d(page, check, shots, name)
        own_coordinates(page, check)
        page.locator(".card details.tech summary").first.click()
        check(page.locator(".card details.tech").first.evaluate("d => d.open"), "technical details open")
        page.evaluate("window.scrollTo(0, 600)")
        check(no_overflow(page), "compare page: no horizontal overflow")
        check(page.locator(".glance-scroll").evaluate("e => e.scrollWidth <= e.clientWidth || getComputedStyle(e).overflowX === 'auto'"),
              "side-by-side table scrolls inside its own box")
        if shots:
            tall = page.evaluate("document.documentElement.scrollHeight * devicePixelRatio") > 30000  # WebKit limit 32767 device px
            page.screenshot(path=os.path.join(shots, f"smoke-{name}-compare.png"), full_page=not tall)

        share(page, check, base)
        play_game(page, check, base, shots, name)
        teach_page(page, check, base, shots, name)
        page.goto(base.rstrip("/") + "/validation.html", wait_until="networkidle")
        page.locator("#validation table").first.wait_for()
        text = page.locator("#validation").inner_text()
        check("°" in text and page.locator("#validation tbody tr").count() >= 20, "validation numbers + ≥ 20 pairs shown")
        check("PGDA" in text and "%" in text, "terrain check against NASA PGDA shown (H9 b)")
        check(no_overflow(page), "validation page: no horizontal overflow")
        if shots:
            tall = page.evaluate("document.documentElement.scrollHeight * devicePixelRatio") > 30000  # WebKit limit 32767 device px
            page.screenshot(path=os.path.join(shots, f"smoke-{name}-validation.png"), full_page=not tall)

        page.goto(base.rstrip("/") + "/about.html", wait_until="networkidle")
        page.locator("#about-items li").first.wait_for()
        check(page.locator("#about-items li").count() == 12, "about page: items a–l listed")
        check(page.locator("#about-lims li").count() >= 3, "about page: limitations listed")
        page.evaluate("window.scrollTo(0, 800)")
        check(no_overflow(page), "about page: no horizontal overflow")
        if shots:
            page.screenshot(path=os.path.join(shots, f"smoke-{name}-about.png"), full_page=True)

        page.goto(base.rstrip("/") + "/sources.html", wait_until="networkidle")
        page.locator("#src-files .src-item").first.wait_for()
        check(page.locator("#src-files .src-item").count() >= 10, "data sources page: frozen files listed")
        href = page.locator("#src-files .src-file a").first.get_attribute("href")
        check(page.request.get(base.rstrip("/") + "/" + href.lstrip("./")).ok, f"data sources page: first file link opens ({href})")
        page.evaluate("window.scrollTo(0, 1200)")
        check(no_overflow(page), "data sources page: no horizontal overflow")
        if shots:
            page.screenshot(path=os.path.join(shots, f"smoke-{name}-sources.png"), full_page=False)
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
