# 0005 — Validation against JPL Horizons (H9a)

- Status: accepted
- Date: 2026-11-14

## Context

The page reads Sun/Earth angles from frozen hourly Horizons tables and interpolates linearly between hours (ADR 0004). Users need
to know how far the shown angles can be from Horizons itself, measured, not assumed.

## Decision

1. `scripts/validate.py` draws `pairs_per_site` minutes per site (`config/validation.json`, fixed seed) inside the table range and
   never on a table row, so every pair exercises interpolation.
2. "Shown" angles come from the page's own code: `scripts/shown_angles.mjs` imports `src/ephem.js` and reads the same frozen tables.
   No second implementation in Python.
3. The reference is a fresh one-minute Horizons request per pair and body, with the same request shape as `fetch_horizons.py`
   (observer `coord@301`, geodetic site, airless apparent az/el), one request at a time with a pause.
4. Results go to `data/validation.json` (all pairs, per-angle largest/average absolute difference, azimuth difference the short way
   round, and how often the power / Earth-communication answer is the same). The file keeps a `pgda` part for the terrain check (H9b).
5. The Validation page (`validation.html`) and README show the file's numbers as they are. Tests fail when the file is missing, when
   its "shown" values no longer match `src/ephem.js` on the frozen tables, when the summary does not follow from the pairs, or when
   the page or README numbers differ from the file.

## Consequences

- Re-running the script needs network access to Horizons and Node 22 on PATH; the page itself never calls Horizons.
- Terrain is not part of this check; the horizon is an ideal sphere here.
- Rollback: delete `validation.html` and its build input; the comparison page does not depend on it.
