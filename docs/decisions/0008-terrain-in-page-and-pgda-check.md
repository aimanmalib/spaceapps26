# 0008 — Terrain horizon in the page, and the independent PGDA check (item j UI, H9 b)

- Status: accepted
- Date: 2026-11-14

## Context

ADR 0007 produced terrain skylines (`data/horizon/`) for the sites inside the LOLA south polar grids (IM-1, IM-2). The page still
compared Sun and Earth with the ideal sphere horizon. PRD H9(b) asks that the terrain result be compared with an independent NASA
product at three or more sites.

## Decision

1. **Page:** a site with a skyline file uses it; every other site keeps the ideal sphere horizon and each scenario says which one it
   uses (card line, side-by-side row, technical details). "Above the horizon" = elevation minus the skyline elevation at the body's
   azimuth (linear between 0.5° samples) is above `horizon_threshold_deg`. Rise/set times and windows reuse the existing window code on
   a table of these relative elevations, so there is one crossing rule. The panorama draws the skyline as the ground shape and the
   ideal sphere horizon as a dashed line. Skylines are loaded only for the site in use (`import.meta.glob`, lazy).
2. **Reference product:** NASA GSFC PGDA "Lunar Polar Illumination" (product 69), average Sun and Earth visibility maps
   `AVGVISIB_75S_120M_201608` (+ `_EARTH`), 120 m per pixel, south polar stereographic, int16 × 0.00004. Format checked from the
   `.LBL` labels (7624 × 7624, LSB int16, pole at pixel 3811.5). NASA data, public, no login; the method paper is cited in
   `REFERENCES.md`. The maps are not downloaded whole: `scripts/pgda.py` reads only the rows around each point with HTTP byte ranges.
3. **Same quantity on both sides:** PGDA counts a step as visible when any part of the disc is visible. The tool's value is the share
   of hours in its one-year Horizons table with elevation + disc radius (Sun 0.267°, Earth 0.95°, `config/pgda.json`) above the
   skyline, computed by the page's own code (`src/terrain.js` through `scripts/terrain_share.mjs`).
4. **Points:** IM-1, IM-2 and one unnamed engineering point (89.45°S, 222.69°E, the existing Horizons check point), which needed a
   one-year Horizons table and a skyline (`config/pgda.json` `extra_points`, written to `data/check/` and `data/horizon/`). It is not a
   landing site and is labelled so.

## Measured

| Point | Sun tool / PGDA | Earth tool / PGDA |
|---|---|---|
| IM-1 | 45.6 % / 46.7 % | 100.0 % / 100.0 % |
| IM-2 | 45.7 % / 46.8 % | 93.2 % / 93.1 % |
| 89.45°S 222.69°E | 85.7 % / 67.7 % | 53.3 % / 52.3 % |

The check point differs by 18 percentage points for the Sun. There the PGDA value changes from 51 % to 85 % within the 3 × 3 pixels
(360 m) around the point, and near the pole the Sun stays within about 1.5° of the horizon, so a one-year table against an 18.6-year
average, the 2 m observer height and the grid resolution can each move the share a lot. The number is reported as measured (R14).

## Consequences

- `features.json` `j_terrain_horizon` = true. Sites north of 75°S keep the ideal sphere horizon (Limitations).
- `scripts/validate.py` now keeps the `pgda` part of the `validation.json` SOURCES entry when it rewrites it.
- Undo: revert this commit; `data/validation.json` `pgda` falls back to the last value and the page to the sphere horizon.
