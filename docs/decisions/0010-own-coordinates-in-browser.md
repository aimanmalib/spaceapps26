# 0010 — Own coordinates (item b): computed in the browser, ideal sphere horizon

Date: 2026-11-14 · Status: accepted

## Context

Item b of the challenge list is "own coordinates". JPL Horizons sends no CORS header, so the page cannot ask it for an arbitrary
point; the frozen tables only cover the listed sites (K6). K6 allows other coordinates only if an in-browser calculation passes the
H9(a) check and is labelled "computed in browser, validated against JPL Horizons". The tier table says the terrain horizon applies
only inside the DEM coverage.

## Decision

- **Engine:** Astronomy Engine 2.1.19 (MIT, pinned exact in `package.json`, cited in REFERENCES.md). `src/moonsky.js` builds the
  local frame from the Moon's IAU rotation model (`RotationAxis`), takes the apparent geocentric Sun (`GeoVector`, aberration on)
  and the geocentric Moon (`GeoMoon`), and moves both to the site on a 1737.4 km sphere (the sphere the Horizons requests use,
  altitude 0). Measured first against the 50 stored Horizons answers: largest difference 0.003° (cos-weighted azimuth). The
  `BackdatePosition` variant was 3× slower and no closer.
- **Same table shape and grid:** the engine produces an hourly table over the same date range as the frozen tables
  (`config/ephemeris.json`), rounded to `config/custom.json` `decimals`, so interpolation, key numbers, timeline and side-by-side
  table reuse the existing code unchanged.
- **Off the main thread:** a year of hourly rows takes about 0.7–2 s on the build host, so it runs in a module Web Worker
  (`src/moonsky-worker.js`, a separate 52 kB chunk loaded only when own coordinates are first used; main bundle unchanged).
  The last `cache_tables` points stay in memory.
- **Check (H9a, "engine"):** `scripts/validate.py --engine` runs the engine through `scripts/engine_angles.mjs` (same grid, rounding
  and interpolation as the page, over the two rows around each time) at the 50 listed-site pairs (stored Horizons answers reused) and
  at 5 new pairs on each of 6 unnamed check points (`config/validation.json` `engine.points`). Result in `data/validation.json`
  `engine`, on the Validation page and in README; unit tests check that the stored "shown" values still match the engine.
- **Horizon:** own coordinates use the ideal sphere horizon only, and every card says so. Computing a terrain skyline in the
  browser would mean shipping LOLA grid tiles and the ray-casting of `scripts/horizon.py` to the page; that is not done in this
  build (smallest reading; listed under Limitations).
- **Input:** two text fields (decimal degrees; the iPhone decimal keypad has no minus key, so not `type=number` with
  `inputmode=decimal`). West longitudes may be typed as negative numbers and are stored as 0–360° east. Out-of-range or non-numeric
  input marks the field `aria-invalid` and shows a message instead of answers. When "Own coordinates" is first chosen, the fields
  are filled with the previously selected site.

## Consequences

- Rollback: set `b_custom_coordinates` false in `config/features.json` (the site list loses the "Own coordinates" entry; the worker
  chunk is never requested).
- Changing the engine version or `config/custom.json` = re-run `python3 scripts/validate.py --engine` (unit tests fail otherwise).
- Smoke test (`e2e/smoke.py`) chooses own coordinates on every profile, checks the bad-latitude message, the answers, the ideal
  sphere label, the timeline and the side-by-side table entry.
