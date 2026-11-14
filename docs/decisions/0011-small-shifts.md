# 0011 — Small shifts in location or date (item l)

Date: 2026-11-14 · Status: accepted

## Context

Item l of the challenge list is "why small shifts in location or date make a big difference". No further wording was given, so this
is the smallest reading: show, for the chosen scenario, the same two answers (Sun above the horizon = power, Earth above the horizon =
direct-to-Earth link) after a small shift in time and in place, with measured numbers, and no new claims.

## Decision

- **Where:** a closed-by-default block "Small shifts in location or date" in every card, under the timeline. It is computed only
  while open, so the default page does not start extra work.
- **Date shifts:** the chosen time ±6 h and ±1 day (`config/shifts.json`), read from the same table and horizon as the card.
- **Location shifts:** only at sites with a LOLA terrain horizon (IM-1, IM-2): points 1 km north, east, south and west along the
  sphere. `scripts/shifts.py` computes their terrain horizon with the exact method of `scripts/horizon.py` (imported, not copied)
  → `data/shift/<site>.json` (~15 kB each, listed in `data/SOURCES.json`). The Sun/Earth angles at those points come from the
  in-browser engine of item b (Astronomy Engine, validated against JPL Horizons, ADR 0010), because the local north direction
  changes by up to several degrees per km near the pole and the site's own table would be wrong in azimuth.
- **Ideal sphere sites:** no location rows; the card states the measured tilt of the horizon plane for the configured distance
  (1 km → 0.033°), computed from the radius, not typed.
- One summary line counts how many shifted rows change at least one answer.
- The engine's table cache rises from 6 to 12 (`config/custom.json`) so four nearby points per terrain card fit next to own points.

## Consequences

- Measured example (IM-2, 2026-11-14 00:00 UTC): Earth +1.3° above the terrain horizon at the site, −1.5° at 1 km east and −2.6°
  at 1 km south; Sun below the horizon in all nine rows.
- Location shifts outside the LOLA grids and for own coordinates are not shown (sphere only) — listed under Limitations in P3a.
- Undo: set `l_small_shifts` to false in `config/features.json`; delete `data/shift/` and `scripts/shifts.py`.
