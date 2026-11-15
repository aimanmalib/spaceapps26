# 0039: PGDA check over the same 18.6 years, and what moves the ridge-point value

Status: accepted, 15 November 2026 (evening). Adopted by the author from an SI red-team review of the entry.

## Context

The terrain check against the NASA GSFC PGDA maps (ADR 0008, ADR 0031) compared the tool's one-year table with NASA's 18.6-year
average, and the text gave "the periods differ" as the reason the numbers do not match. At the ridge check point (89.45° S,
222.69° E) the Sun differed by 18.0 percentage points. The red-team review measured that claim with an independent ephemeris
(DE421) and found it wrong: over 18.6 years the same skyline still gives 85.3 % against NASA's 67.7 %.

## Decision

- `scripts/pgda_period.py` (helper `scripts/pgda_period_share.mjs`) repeats the check over 18.6 years of hourly steps
  (`config/pgda.json` "period": 163048 steps from 2009-07-13, the first date in the PGDA label, which gives the length of the
  simulation but not its dates). Sun and Earth angles come from the in-browser engine, already checked against JPL Horizons, so
  no new dependency is needed; the review's DE421 numbers agree with it to 0.01 percentage points. Block `pgda_period` of
  `data/validation.json`; the one-year block `pgda` is kept as it was.
- Result: IM-1 Sun 46.6 % against 46.7 %, IM-2 46.9 % against 46.8 %, Earth 100.0 / 100.0 and 93.2 / 93.1. Ridge point: Sun
  85.3 % against 67.7 % (17.6 points), Earth 55.4 % against 52.3 %; every full calendar year gives 82.3 % to 85.8 % for the Sun.
- Ridge sensitivity, same script: the skyline recomputed with the observer on the ground gives 57.2 % (2 m: 85.3 %, the published
  skyline); the nine points 120 m apart (one PGDA pixel) give 58.7 % to 86.5 %; at 2 m the skyline is set by ground closer than
  1 km in 473 of 720 directions. The PGDA value lies between the two observer heights.
- Text: "the periods differ" is removed as an explanation (README, Validation page, all three languages). The Validation page has
  a new section after the one-year table; the README has the second table and the ridge paragraph; slide 6 quotes the same-period
  rows. The home page's validation line gives the same-period number at the two landing sites and says that a ridge test point
  differs more (the full ridge numbers are one click away, not hidden).
- Not done: the 100-point sample (ADR 0031) still uses the one-year table; the text says so.

## Way back

`git revert` of this commit and `bash deploy/pasang.sh`, `bash deploy/pages.sh`: the earlier text and numbers return.
