# 0007 — Terrain horizon profiles from LOLA (item j, data step)

- Status: accepted
- Date: 2026-11-14

## Context

The Horizons tables give Sun and Earth elevation above the ideal-sphere horizon. The challenge text notes that the horizon
"is determined by local terrain and the edge of the lunar sphere", and that south polar terrain "can significantly affect
horizon positions and visibility windows". No open-source tool for a terrain horizon from the LOLA DEM was found
(PELAN search, 14 Nov 2026), so the standard method is built here.

## Decision

1. **DEM:** LOLA GDR south polar stereographic grids `ldem_80s_80m.img` (80 m, 7600 × 7600) and `ldem_75s_240m.img`
   (240 m, 3812 × 3812), downloaded once to a cache folder outside the repo (`python3 scripts/horizon.py --download`).
   Layout and scaling are taken from the `.lbl` labels (16-bit LSB, height = DN × 0.5 m above 1737.4 km, pole at pixel
   centre). Every point is sampled from the finest grid that covers it (bilinear).
2. **Projection check:** the DEM height at IM-2 (84.7906°S, 29.1957°E) is 5321 m, the same as the "5321 meters elevation"
   printed on the LROC page cited for that site. A unit test keeps this agreement for every covered site whose source prints an
   elevation, and a second test locks the orientation (longitude 0 up, 90°E right).
3. **Method (`scripts/horizon.py`):** for each site south of 75°S, one ray per 0.5° of azimuth along the great circle,
   observer 2 m above the DEM surface; step 40 m, then growing with distance (0.4 % of the distance), out to 300 km or the
   edge of the grids. Elevation of each terrain point is computed in 3D from the local tangent plane of the ideal sphere —
   the same reference as the Horizons tables — so the curvature of the Moon is included and "Sun elevation > horizon
   elevation" can be read directly. Output per site: skyline elevation, distance of the skyline point and how far the ray
   reached (`data/horizon/<site>.json`, about 10 KB each). All parameters are in `config/horizon.json`.
4. **Cost (K15):** both sites in 3.2 s on one core under `nice -n 19`; no remote runner needed.

## Measured

- Step check: with 20 m first step, 0.1 % growth and 500 km reach the profiles change by at most 0.042° (IM-1) and
  0.027° (IM-2); mean change under 0.003°. No skyline point lies within 20 km of the end of its ray.
- IM-1 (80.2°S, 1.0°E): rays toward the north leave the 75°S grid after about 157 km; the skyline in every direction is
  at most 55 km away, so the cut does not change the result at this step size.
- Skylines: IM-1 −0.70° … +2.59°; IM-2 −1.47° … +4.06° (negative = terrain below the sphere horizon, seen from a high point).

## Consequences

- Only IM-1 and IM-2 lie inside the grids; other sites keep the ideal-sphere horizon and the interface must label it so.
- The browser step (visibility against the terrain horizon) and the comparison with an independent NASA PGDA product
  (H9 b) are the next step.
- Undo: delete `data/horizon/` and its `data/SOURCES.json` entries; nothing else reads them yet.
