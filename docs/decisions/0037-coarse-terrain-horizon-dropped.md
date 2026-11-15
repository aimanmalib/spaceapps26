# 0037 — Terrain horizon for own coordinates: measured, not shipped (P4l)

Status: accepted, 15 November 2026. SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md.
Superseded the same evening by ADR 0106: the 400 m / 960 m setting ships for own points south of 75° S, with the full 80 m grid
within 20 km of the pole. The measurements below stand.

## Context

NASA's challenge text asks for "the ability to input custom lunar coordinates" and says "Consider accounting for the
Moon's actual topography, as terrain elevation can significantly affect horizon positions and visibility windows".
Own coordinates use the ideal-sphere horizon. The author chose this option on 15 November 2026 (see SI-DISCLOSURE.md),
with a quality gate set before the work started: compute the terrain horizon in the browser from a coarse copy of the
LOLA south-polar grids (at most 1.5 MB after gzip), compare it with the exact 80 m profiles at every site that has one,
and ship only if both answers (Sun above the horizon, Earth above the horizon) agree in at least 97 % of the hours of
the year at every site.

## What was measured

Method: the same ray method as `scripts/horizon.py` (0.5° azimuth step, rays up to 300 km or the grid edge, observer
2 m, ideal-sphere tangent plane, curvature included), run in JavaScript on block-mean copies of `ldem_80s_80m` and
`ldem_75s_240m`. Compared with `data/horizon/im-1.json` and `data/horizon/im-2.json` on the one-year hourly JPL Horizons
tables (`data/ephem/`, 8,761 hours each), centre of the disc, threshold 0°.

| Coarse cells (80°S grid / 75°S grid) | Size, gzip -9 | IM-1 both answers same | IM-2 both answers same |
|---|---|---|---|
| 800 m / 1.92 km | 1.45 MB | 96.11 % | 99.04 % |
| 640 m / 1.92 km | 2.02 MB | 95.42 % | 99.10 % |
| 400 m / 960 m   | 5.71 MB | 97.24 % | 99.45 % |

At 400 m the difference in skyline elevation at IM-1 had a median of 0.17° and a 95th percentile of 1.36°. At IM-1 the
skyline lies within 2 km of the site at 412 of the 720 azimuths, so a coarse grid smooths exactly the slopes that set
the horizon there. Point sampling instead of the block mean did not pass either (800 m: IM-1 95.69 %).

## Decision

Not shipped. The only setting that passed the 97 % gate (400 m) is almost four times the 1.5 MB size limit, and it
passed IM-1 by 0.24 percentage points. Within the size limit the gate fails at IM-1. Own coordinates keep the
ideal-sphere horizon; the existing Limitations line in the README and on the About page stays as it is. No file in
`data/`, no page code and no published number changed; the experiment code was not kept.

## Way back

To try again: a finer grid only near the chosen point (tiles of the 80 m grid loaded on demand) would remove the
near-field error, but it needs the full 80 m grid (115 MB) hosted with the site. That is outside this entry's scope.
