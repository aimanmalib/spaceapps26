# 0028 — Earth view, drawn to scale, under the two answers (P4v)

Status: accepted, 15 November 2026. Presentation of items j and l from the independent review (P4v); design and code by SI
(SI-DISCLOSURE.md). No data file changes; no new numbers beyond what the card and the small-shifts table already compute.

## Context
The 1 km finding (IM-2: Earth above the skyline at the site, below it 1 km east) was only readable in a table. The review asked
for one picture that shows it: a window of sky toward Earth, to scale, with the LOLA skyline, and buttons for the nearby points.

## Decision
- `src/earthview.js` (pure) draws an SVG whose viewBox is in degrees (x = azimuth from the body's azimuth − width/2, y =
  elevation), so `preserveAspectRatio="xMidYMid meet"` keeps one degree the same number of pixels across and up (unit test +
  smoke check of the rendered box). The disc radius = `config/view.json` `timeline.year.disc_radius_deg` (Earth 0.95°, Sun
  0.267°, the P4u values). The terrain is drawn over the disc, so a partly hidden disc looks partly hidden.
- Width: the row says "±26°"; the reviewer's own reference picture is 26° wide. 26° across is used (`config/earthview.json`
  `width_deg`) so the 1.9° Earth disc stays about 7 % of the width (≈ 25 px at 320 px); a reading of ±26° (52°) would halve it.
  Recorded here as the smallest reading; change one number to switch.
- Elevation range = disc + skyline + 0° inside, padded (`pad_deg`), at least `min_height_deg` tall. Dashed line = smooth Moon
  (0°, the ideal-sphere horizon of the Horizons tables).
- Buttons: "At the site" + one per direction of `config/shifts.json` (1 km north/east/south/west). Nearby points use the same
  data as the small-shifts table: own skyline from `data/shift/`, Sun/Earth angles from the in-browser engine (cached per point,
  so the table and the view share one computation). Sentence = centre margin + the P4u disc label (same rule as the card).
- "Toward Earth / Toward the Sun" switch (`bodies`), cheap because the same drawing serves both.
- Placed right under the two answers on cards with a terrain skyline (IM-1, IM-2); hidden elsewhere.

## Undo
`git revert` the P4v commit(s), `npm run build`, `bash deploy/pasang.sh`.
