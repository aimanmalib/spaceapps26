<!-- SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md -->
# 0019: First screen — answer first, one set of numbers (P4b)

Date: 2026-11-14. Status: accepted. Presentation only; no new feature, no change to `data/`.

## Context

The pre-submission review found that the compare page opened with text, that the large number on a terrain-site card was the
JPL Horizons elevation (for example "+0.9° Sun elevation" under "No sunlight for solar power", because the terrain skyline in that
direction is +3.3°), and that the small-shifts table on the same card used a different measure (degrees above the horizon used).
The shared panorama scale can be ±90°, so near the pole the Sun, Earth and skyline sit on one flat line.

## Decision

- Scenario cards come right after a one-sentence intro (`tool.lede`); the status paragraph, the longer intro and the data label
  move into one folded "How to read this" block; the "Side by side" table moves below the cards.
- The large number on each answer is the margin from the horizon the card uses (terrain skyline or ideal sphere), written as
  "2.4° — Sun below the terrain horizon". It is computed by the same function as the small-shifts table (`judge` in
  `src/shifts.js`), so the card and that table always show one number. On terrain sites a small line keeps the Horizons
  elevation and the skyline elevation behind it. The side-by-side table shows the same signed margin.
- Terrain sites get a second panorama strip at ±`near_horizon_deg` (config/view.json, 10°) under the main one.
- On the first card the small-shifts block starts open, and the 2D map block starts open when the window is at least
  `first_card.map_open_min_width_px` (1024 px) wide. Values live in `config/view.json`, text in `i18n/en.json`.
- Tests: `tests/firstscreen.test.mjs` (margin = elevation − skyline = small-shifts value; strip only on terrain sites; page
  order); `e2e/smoke.py` checks the same on the deployed site in Chromium 1280/320 and WebKit iPhone 13.

## Way back

`git revert` this commit and `bash deploy/pasang.sh`: the layout of `13d464b`/`dd24887` returns unchanged.

## P4f — first screen fits (15 Nov 2026)

Layout only; no feature, data, number or claim changed. Measured on `0e70263`: on a 1280 × 900 window the Earth large
number of the first card ended at 910 px (cut off); on WebKit iPhone 13 (664 px tall) the first answer started at 709 px.
Change in `src/styles.css`: page top padding `--shell-top` (was 2 × `--space`), tool gap `--tool-gap` (was 1.5 × `--space`),
smaller margins under the title, "How to read this", card head and before the answers; on windows ≤ 30rem a smaller
eyebrow and section heading and a tighter field gap. The intro sentence and the "How to read this" fold stay. Result on
the local build: Earth number bottom 838 px (≤ 900), first answer top 601 px (≤ 664). `e2e/smoke.py` checks both
limits (`FIRST_SCREEN`); on the old layout it fails with exactly the two numbers above. Media and `demo/demo.pdf`
re-captured (7 pages, 16:9).

Way back: `git revert` the P4f commit and `bash deploy/pasang.sh` (the P4e layout returns).

## P4g — one-year range on the timeline (15 Nov 2026)

Completes item d ("changes across the lunar day and season"; NASA: "Earth libration and lunar orbit variations"); not a
new idea, and no data file changed (`git diff -- data/` empty). Each card's timeline gets a two-button switch: "One lunar
day" (default, unchanged) and "One year" (the whole frozen Horizons table, hourly steps). Same chart: lines are drawn
through every `line_every_steps`-th row to keep the SVG light; the in-view bars use every row. The year caption counts
the hours with any part of the disc above the horizon used (terrain or ideal sphere), the H9(b) definition, so for IM-1
and IM-2 it equals the "this tool" numbers in `data/validation.json` `pgda` (unit test; IM-2: 45.7 % Sun, 93.2 % Earth).
The shared helper moved to `src/terrain.js` (`discShare`, used by `visibleShare`). Settings in `config/view.json`
`timeline.year`; disc radii must equal `config/pgda.json` (test). Smoke: switch to one year on the first card, path drawn,
caption shown, back to one lunar day; 3 profiles.

Way back: `git revert` the P4g commit(s) and `bash deploy/pasang.sh` (the P4f page returns).
