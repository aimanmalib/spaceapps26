# 0106 — Terrain horizon for own coordinates: LOLA grids in the browser (revisits ADR 0037)

Status: accepted, 15 November 2026 (evening). SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md.
Replaces the decision of ADR 0037 ("not shipped"); its measurements stand and are reproduced below.

## Context

The challenge asks that a planner can "evaluate alternative sites in the same region" and type their own coordinates, and to
consider "the Moon's actual topography". Until now own coordinates used the ideal-sphere horizon everywhere (ADR 0037): the
only coarse grid that passed the 97 % gate (400 m / 960 m) was almost four times ADR 0037's 1.5 MB size limit. The entry's
work plan of 15 November 2026 (evening) asked to ship that setting for own points inside the LOLA south-polar grids, loaded
only when needed, with the gate measured again at every listed polar site that has an 80 m skyline and any failure named on
the card.

## Decision

- **Where:** own points at or south of 75° S (`config/terrain-own.json` `lat_max`, the edge of the 240 m grid). North of it
  nothing changes: ideal sphere, no download.
- **Data:** `scripts/terrain_coarse.py` writes three grids from the cached LOLA DEMs into `data/terrain/` (listed in
  `data/SOURCES.json`, copied to `dist/data/` by the existing build step): the unchanged 80 m pixels in a 500 × 500 px square
  around the pole (± 20 km), a 400 m block mean of the 80 m grid and a 960 m block mean of the 240 m grid. Same 16-bit format
  and projection as the source. 6.94 MB in total, 6.11 MB with gzip -9.
- **Method:** `src/terrain-own.js` is `scripts/horizon.py` in JavaScript (0.5° azimuth step, rays to 300 km or the grid edge,
  observer 2 m, tangent plane of the ideal sphere, curvature included, finest grid first). On a test grid it gives the same
  skyline as `horizon.py` to 1e-9°; on the full 80 m and 240 m DEMs it reproduces `data/horizon/im-1.json` and
  `shackleton-ridge.json` to the file's 0.01° rounding.
- **Loading:** the first own point in the area starts a Web Worker (`src/terrain-worker.js`) that downloads the grids once
  per page ("Loading LOLA terrain for this point (up to 6.9 MB, once per visit)…"); later points reuse them, later visits get
  them from the browser cache. The table for the Sun and Earth is computed as before, for any date up to 2030 (ADR 0104); the
  skyline does not depend on the date.
- **Label on the card**, by the grid used at the point: inside the pole crop "LOLA terrain, full 80 m grid (within 20 km of the
  pole)"; on the 400 m copy "LOLA terrain, coarse 400 m grid — agrees with the 80 m profiles in ≥ 97 % of hours at 8 of 10
  polar sites (ADR 0037). Not at Shackleton connecting ridge (53.8 %), de Gerlache Rim 2 (93.43 %): on narrow ridges and
  crater rims the coarse grid lowers the ground, so treat the answer there as rough."; on the 960 m copy (75° S to 80° S) "not
  checked against 80 m profiles". The numbers and the names come from `data/terrain/gate.json`, not from the text: every
  listed site below the gate on the coarse copies is named, worst first. Technical details list every measured listed site.
- If the download fails the card falls back to the ideal sphere and says so.
- "Small shifts" on such a card has no precomputed nearby skylines (those exist for listed sites only); it says so and
  suggests typing the nearby point as another scenario, which then gets its own skyline.

## Measured gate (both answers the same, centre of the disc, threshold 0°)

`node scripts/terrain_gate.mjs` → `data/terrain/gate.json`. One-year hourly JPL Horizons tables (`data/ephem/`, 8,761 hours
each); the reference is each site's 80 m skyline in `data/horizon/`. "Coarse copies alone" = the 400 m and 960 m grids without
the pole crop, which is what a point outside the crop gets. The unnamed check point of `config/pgda.json` (it has an 80 m
skyline and a one-year Horizons table in `data/check/`) is measured too; it is not a listed site.

| Point | Latitude | Grid at the point | As shipped | Coarse copies alone | Skyline diff on the coarse copies, median / p95 |
|---|---|---|---|---|---|
| IM-1 nominal | 80.20° S | 400 m | 97.24 % | 97.24 % | 0.17° / 1.36° |
| IM-1 where it came to rest | 80.13° S | 400 m | 99.45 % | 99.45 % | 0.18° / 0.66° |
| IM-2 Athena | 84.79° S | 400 m | 99.50 % | 99.50 % | 0.03° / 0.61° |
| Nobile Rim 1 | 85.36° S | 400 m | 98.24 % | 98.24 % | 0.15° / 0.52° |
| Malapert Massif | 86.00° S | 400 m | 97.91 % | 97.91 % | 0.06° / 0.39° |
| Nobile Rim 2 (ADR 0105) | 84.20° S | 400 m | 98.20 % | 98.20 % | 0.04° / 1.13° |
| Mons Mouton Plateau (ADR 0105) | 84.53° S | 400 m | 98.19 % | 98.19 % | 0.03° / 0.77° |
| Haworth (ADR 0105) | 86.70° S | 400 m | 99.51 % | 99.51 % | 0.02° / 0.20° |
| de Gerlache Rim 2 (ADR 0105) | 88.52° S | 400 m | **93.43 %** | **93.43 %** | 0.10° / 1.35° |
| Shackleton connecting ridge | 89.68° S | 80 m (pole crop) | 99.90 % | **53.80 %** | 0.33° / 5.27° |
| Check point 222.69° E | 89.45° S | 80 m (pole crop) | 99.95 % | **81.77 %** | 0.38° / 2.81° |

IM-1 and IM-2 match ADR 0037 (97.24 %; IM-2 99.50 % here against 99.45 % there, the same order of agreement). On the coarse
copies alone both points near the pole fail: the 400 m block mean puts the observer on the narrow Shackleton ridge 51 m too
low (1,673 m against 1,724.5 m), so the skyline rises by about 2° on average and the Sun answer differs in 28.8 % of the
hours. That is why the 80 m pole crop was added (0.5 MB, 0.39 MB gzip): with it both points pass with 99.9 %. No listed site
lies between 75° S and 80° S, so the 960 m copy is not checked against an 80 m skyline; the card says so.

The four Artemis III candidate points of ADR 0105 were measured when that branch was merged (15 November 2026, evening). Three
pass. de Gerlache Rim 2, a crater rim about 45 km from the pole and so outside the crop, does not: 93.43 % of the hours give
both answers the same, mostly through the Earth answer (94.67 % the same; Sun 98.74 %). The 400 m label names it next to the
Shackleton ridge; the listed site itself keeps its 80 m skyline.

## Changed from the request

- The grids are in `data/terrain/`, not `public/`: `data/SOURCES.json`, its provenance test and the Data sources page are
  built around `data/` (every `file` path is relative to it), and the build already publishes that folder.
- The 80 m pole crop was not in the request; it was added after the measurement above, because the two measured points in
  the Shackleton region, where many own points will be typed, had a different answer in 46 % and 18 % of the hours on the
  400 m copy.

## Limits

- A point just outside the 20 km crop on a narrow rim can behave like the Shackleton ridge on the 400 m copy, and de Gerlache
  Rim 2 shows that a crater rim farther out can too. The 400 m label names both; eight measured sites support the 97 % figure.
  An 80 m crop of ± 50 km (1,250 × 1,250 px) would reach de Gerlache Rim 2 and add 2.6 MB to the first download; whether
  the point would then pass is not measured. Not done for the entry.
- The first download is 6.9 MB. `deploy/nginx.conf` compresses `application/json` but not `application/octet-stream`, so the
  `.bin` files go uncompressed (adding the type there would save about 0.8 MB); with `Cache-Control: no-cache` the browser
  revalidates them per visit (304) instead of downloading again.
- README Limitations still says own coordinates use the ideal sphere only; it is outside this branch and is to be updated on
  `main`. The About page limitation is updated.

## Way back

Set `lat_max` in `config/terrain-own.json` to −91: no point qualifies, own coordinates return to the ideal sphere and the
grids are never downloaded. Or revert the commits of this ADR; `data/terrain/` and its four `data/SOURCES.json` entries go with
them.
