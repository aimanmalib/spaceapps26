# 0041: Terrain range on the terrain cards

Status: accepted, 15 November 2026 (evening). Adopted by the author from an SI red-team review of the entry.

## Context

The review showed (ADR 0039) that a skyline traced from the 80 m LOLA grid can change a lot within one pixel and with the
observer's height, yet the cards gave each answer as a single yes or no with no sign of how firm it is.

## Decision

- `scripts/band.py` (helper `scripts/band_share.mjs`): for each listed site with a skyline, the skyline is recomputed at the
  3 x 3 block of points 80 m apart (one LOLA pixel, `config/band.json`) with the observer at 0 m and at 2 m: 18 skylines.
  `data/band/<site>.json` keeps the lowest and highest skyline per azimuth, the one-year shares of every variant (the cards'
  centre rule and the one-year any-part rule) with their lowest and highest, and the share of hours in which an answer differs
  between the lowest and the highest skyline. The site's own Horizons angles are used for every variant (80 m moves them by
  less than 0.003 degrees). The centre variant at 2 m must reproduce `data/horizon/` exactly, or the script stops.
- `src/band.js`: an answer "changes inside the range" when the Sun or Earth is above the lowest skyline in its direction but not
  above the highest (the same threshold as the answers). The envelope is taken per azimuth, so it is slightly wider than the
  18 single skylines; the text calls it a range, not a probability.
- Card: one row inside the answers list under the two answers: whether an answer changes, what the range is, and the one-year
  shares across it. The answer and its marker in the horizon strip get a ring when the answer changes; the strip draws the
  range as a band around the skyline. The two answers themselves are unchanged (first-screen limits of ADR 0040 hold).
- Measured: IM-2 Sun 43.8 % at the site, 40.0 % to 44.0 % across the range; Earth 80.1 %, 74.7 % to 80.5 %; an answer changes
  inside the range in 4.2 % (Sun) and 5.8 % (Earth) of the year's hours. IM-1: Sun 44.8 %, 41.5 % to 46.2 %; Earth 100.0 %,
  95.2 % to 100.0 %; 5.9 % and 4.8 % of the hours.
- Limits, stated in the README: it is a sensitivity range for the 80 m grid, not an error bar on the real ground; own
  coordinates and the other sites have no range.

## Way back

`git revert` of this commit, then `bash deploy/pasang.sh` and `bash deploy/pages.sh`. Without `data/band/` the cards and the
strip show no range (the page reads it only where a file exists).
