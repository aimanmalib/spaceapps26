# 0027 — Whole disc / part / hidden, and "Over the whole year" for 1 km shifts (P4u)

Status: accepted, 15 November 2026. Accuracy fix from the independent review (P4u); design and code by SI (SI-DISCLOSURE.md).

## Context
An independent review read a card saying "Solar power possible" with a margin of 0.0°, and noted that the 1 km finding rested
on one chosen hour. The Sun (radius 0.267° seen from the Moon) and Earth (0.95°) are discs, not points.

## Decision
- The yes/no answers keep the published rule: the centre of the disc above the horizon used (`horizon_threshold_deg`). The
  validation numbers (Horizons pairs, engine pairs, PGDA) therefore keep their meaning and do not change.
- Each answer adds a label: whole disc above, partly hidden (centre closer to the horizon than the disc radius) or whole disc
  below (`src/disc.js`). Shown on the card, in the side-by-side table, in the verdict sentence (only "partly"), and defined in one
  sentence on the Validation page. Radii = `config/view.json` `timeline.year.disc_radius_deg` (test: equal to `config/pgda.json`),
  mean distances (Sun 696 000 km / 149.6 million km; Earth 6 371 km / 384 400 km). The engine does not give distances for the
  frozen Horizons tables, so the radius does not vary with distance.
- New file `data/shift-year/shift-year.json` (`scripts/shift_year.mjs`, build time, no download): for IM-1 and IM-2 and their four
  1 km points, the share of the 8761 hourly steps with the centre (and any part) of each disc above the skyline. Site: Horizons
  table + `data/horizon`. Nearby points: own skyline from `data/shift` + Astronomy Engine angles (what the page shows there);
  using the site's Horizons angles instead changes no share by more than 0.5 percentage points (stored as
  `site_angles_effect_max`). The site disc shares equal the published PGDA tool values (unit test).
- "Small shifts" shows a second small table "Over the whole year" and one sentence generated from the file (the nearby point
  whose Earth share differs most). Slide 4, README and the form text get one measured year sentence; [A][B][C] unchanged.

## Undo
`git revert` the P4u commit(s), `npm run build`, `bash deploy/pasang.sh`; restore the form text sentence in `docs/hantar/`.
