# 0031 — Terrain horizon against NASA PGDA at 100 random points, and one command to rebuild the data (P4q)

Status: accepted, 15 November 2026. Validation work (measured numbers), from the plan line P4q; design and code by SI
(SI-DISCLOSURE.md). No existing number changes: the `horizons`, `engine` and `pgda` blocks of `data/validation.json` are
byte-for-byte the same; the new numbers are the extra block `pgda_sample`.

## Context
The PGDA check (ADR on H9b, `scripts/pgda.py`) covers three points: IM-1, IM-2 and one check point. Three points cannot show
how the terrain horizon behaves over the polar area in general.

## Decision
- `config/pgda.json` `sample`: 100 points, seed 20261115, uniform over the area south of 80° S (uniform in sin(latitude) and in
  longitude), so the points sit inside the LOLA 80 m grid. Not chosen by hand.
- Each point: its own skyline with the same ray casting and settings as `data/horizon/` (`scripts/horizon.py`), and Sun/Earth
  angles from the in-browser engine (`src/moonsky.js`, checked against Horizons on the Validation page) over the one-year period
  of `config/ephemeris.json`. No new Horizons requests. Share rule = the page's own (`src/terrain.js`, any part of the disc).
- PGDA value: nearest pixel and the range of the 3 × 3 pixels around it (`scripts/pgda.py` helpers, HTTP byte ranges).
- Reported: count, median, 90th percentile, largest absolute difference, mean signed difference, and the number of points where
  the tool's value is inside the 3 × 3 PGDA range. Reported as measured, with the known differences in definition (one year
  against 18.6 years; observer 2 m above the ground) and no claim about causes that were not measured.
- Skylines of the sample points are not stored (they would add about 0.4 MB); `scripts/reproduce.sh` rebuilds them.
- `scripts/validate.py` keeps the `pgda_sample` block when it rewrites the file.
- Validation page: a table and two SVG scatter charts (PGDA across, tool up, dashed y = x) drawn from the file. README and the
  form text: one table / one line with the same numbers (a test checks the README row against the file).
- `scripts/reproduce.sh` + `docs/REPRODUCE.md`: every data script in order, then the tests; `--list` prints the steps.
- Slide 6 is unchanged (no room without crowding; the deck stays at 7 pages).

## Result (measured 15 November 2026)
Sun: median 0.9, 90th percentile 2.4, largest 10.7 percentage points; inside the 3 × 3 range at 61 of 100 points.
Earth: median 1.1, 90th percentile 5.6, largest 21.8 percentage points; inside the range at 64 of 100 points.
Run time: about 7 minutes wall clock, one process at `nice -n 19`.

## Undo
`git revert` the P4q commit + `bash deploy/pasang.sh` (+ `bash deploy/pages.sh`).
