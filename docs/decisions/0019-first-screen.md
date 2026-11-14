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
