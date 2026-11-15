# 0104: Dates to the end of 2030 for every site

Status: accepted, 15 November 2026 (evening). Adopted by the author after comparing the date range with a competing tool that
covers 2027 to 2030.

## Context

Every listed site answered only from 1 November 2026 to 1 November 2027, the range of the frozen JPL Horizons tables
(`config/ephemeris.json`). A mission planned for 2028 to 2030 could not be looked at. The in-browser engine used for own
coordinates (`src/moonsky.js`, Astronomy Engine) already gives the same table shape and was checked against Horizons inside the
frozen range (`data/validation.json`, "engine").

## Decision

- Accepted dates: `config/ephemeris.json` start to `config/years.json` stop (2031-01-01 00:00 UTC, so all of 31 December 2030),
  for every listed site and for own coordinates. "Now" in the share block uses the same range.
- Inside the frozen range nothing changes: a listed site reads its Horizons table. After it, `src/years.js` asks the engine for a
  block of `chunk_days` (365) counted from the frozen end, padded by `pad_days` (45) on both sides, and merges it on the same
  hourly grid: rows up to the frozen end stay the Horizons rows, later rows are engine rows. Times within `pad_days` of the frozen
  end already use the first block, so the timeline, "If the date moves" and "Next windows" run on past 1 November 2027 instead of
  stopping at the table edge. Nearby points (1 km shifts, Earth view) get the same blocks.
- The horizon does not change with the source: the LRO LOLA skyline on terrain sites, the ideal sphere elsewhere (the merged table
  goes through the same `relativeTable` and judgement as before).
- Every card names the source of its angles under the horizon line: "JPL Horizons table, precomputed for this site" or "in-browser
  engine, validated against JPL Horizons". The elevation line under each answer and the technical details say the same. The
  engine label claims validation for the later dates only if `data/validation-years.json` passes the rule in `config/years.json`
  (every difference at most `max_diff_deg` = 0.05°, every yes/no answer the same); otherwise it says those dates are not
  validated.
- New check `scripts/validate_years.py`: 24 random pairs (seed 20261116) at the listed sites from 2028-01-01 00:00 to 2031-01-01 00:00 UTC, never on a table hour; engine (`scripts/engine_angles.mjs`, same grid, rounding and interpolation as the page) against a fresh one-minute Horizons request. Measured on 2026-11-15: largest difference 0.0045° (Sun az 0.0032°, Sun el 0.0028°, Earth az 0.0045°, Earth el 0.0036°), mean 0.0013°; same solar power answer 24 of 24, same Earth answer 24 of 24. Result in `data/validation-years.json` (`passed`: true), source entry in `data/SOURCES.json`. Unit tests check that the file's summary and verdict follow from its rows, so the label cannot claim more than the file.
- Past the frozen end, the timeline's "one year" view and the "Next windows" share line cover the card's block (up to 455 days)
  and state its dates; windows are not searched beyond the block. Measured cost: one block takes about 0.5 s in Node; the page
  computes it in the existing Web Worker.
- The one-year blocks that come from precomputed files (year shares in the 1 km table, Overview, PGDA checks) stay on the frozen
  year; they say which dates they use.

## Way back

`git revert` of these commits: dates end at 1 November 2027 again; `data/validation-years.json` and its `SOURCES.json` entry go
with them.
