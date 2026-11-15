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

## Default pair (P4v part 3)
- The two default cards (IM-2 and Apollo 11 at 2026-11-14 00:00 UTC) gave the same two answers. Rule from the row: prefer the other
  south polar terrain site at the same time; IM-1 then also gives Sun no / Earth yes, so the second card is IM-2 two days later
  (2026-11-16 00:00 UTC: Sun yes, Earth yes). The first card stays IM-2 at 2026-11-14 00:00. Unit test `tests/defaults.test.mjs`.
- README step 1, slide 3 (side-by-side crop and caption), `compare.png` and its gallery caption follow. Slide 1's picture is now the
  Earth view of the first card (`deck-cards`, 700 px viewport so the card is one column; shot last because resizing re-lays out).
- The Teach page keeps its own pair (Apollo 11 and IM-2, `config/teach.json`): that step is about the pole versus the equator.

## Not yet done (second slice of P4v)
First screen at 1366 × 768 (verdict + main buttons after the intro, one trust line from `data/validation.json`, site and date on one
line), folding long blocks on the first card, and a 1366 × 768 smoke profile.

## Undo
`git revert` the P4v commit(s), `npm run build`, `bash deploy/pasang.sh`.
