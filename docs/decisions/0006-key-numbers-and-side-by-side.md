# 0006 — Key numbers, time remaining and side-by-side table (tier T1: items f, e, c)

- Status: accepted
- Date: 2026-11-14

## Context

Tier T1 adds three items of the challenge list on top of the T0 comparison: f "solar elevation angle … duration of sunlight, and
Earth visibility windows", e "how much time remains before sunset or Earthset", and c rapid side-by-side scenario comparison.
Terrain (item j) is a separate T1 slice; this one still uses the ideal sphere horizon.

## Decision

1. **Windows from the same table and interpolation as the shown angles** (`src/windows.js`). Rise/set = the time where the linearly
   interpolated elevation crosses `horizon_threshold_deg`. No second ephemeris source, so the window agrees with the answer on the
   card by construction.
2. **Item e, smallest reading:** body above the horizon → "Sunset/Earthset in …". Body below → "Sunrise/Earthrise in …", because the
   "visibility window" of item f is then the next one and its start is that rise; showing the window without its start would be
   unexplained.
3. **Item f:** the elevation is the large number of each answer (signed, true minus sign). The window line gives the duration of the
   current window (body up) or the next one (body down), with its UTC start and end.
4. **Table edges:** a window that runs past the start or end of the precomputed table is shown as "at least …" with the table edge as
   its bound; no rise left in the table → "No sunrise before the end of the data". Nothing is extrapolated.
5. **Durations** show the two largest non-zero units of d / h / min (minutes rounded). Unit words live in `i18n/en.json`.
6. **Item c:** one table above the cards, one column per scenario, rows = the same strings the cards show (`src/facts.js` builds
   them once for both). No ranking or score: the challenge names no ranking. The table scrolls inside its own box at 320 px.

## Consequences

- Near the south pole the Sun and Earth skim the horizon, so with the ideal sphere horizon windows can be days long; terrain (j)
  will shorten them, and the page states the horizon model.
- Near-side equatorial sites (e.g. Apollo 11) show "No Earthset before the end of the data": Earth never sets there.

## Rollback

Revert this ADR's commit: the cards return to the T0 answers and the table disappears; `config/features.json` items c/e/f go back
to `false`.
