# 0036: Slope and NASA average sunlight layers on the 2D map (P4k)

Status: accepted, 15 November 2026.

## Context

The author chose option D on 15 November (SI listed it from NASA's challenge text: "South pole terrain is particularly complex,
and you may consider how to represent steep slopes and deep craters that create extreme shadow conditions").

## Decision

- The 2D map (item h) gets three layer buttons, Heights first (default, unchanged), then Slope and Average sunlight (NASA PGDA).
  The buttons reuse the pressed-button style of the view toward Earth (`.ev-btn`, `aria-pressed`).
- Slope is computed in the page from the existing `data/map/<site>.json` heights with the same central-difference gradient as the
  relief shading (cells 0.5 km apart). No new data file. Colour range 0° to 30° (`config/map2d.json` `layers`), steeper = end colour.
- Average sunlight is NASA's product, not computed here: the PGDA average Sun visibility map already used for the validation
  (`config/pgda.json`, 120 m pixels) is read on the same cell centres as the height map, nearest pixel per cell, by
  `scripts/map_sunlight.py` (one HTTP byte range per site, nothing large stored). New files `data/map-sunlight/<site>.json`
  (integer percent); `data/map/`, `data/validation.json` and every published number are unchanged; `data/SOURCES.json` gains two
  entries at the end. Check: the centre cell equals the PGDA value of the published H9(b) check at both sites (47 %), locked by
  `tests/test_map2d.py`.
- The tool does not compute shadows on the map; the captions say
  so on the Slope and Average sunlight layers.
- Colour stops are CSS tokens (`--map-slope-*`, `--map-sun-*`), dark to light so the order reads without colour.
- Gallery image `docs/media/map-sunlight.png` (`scripts/capture_media.py --map-sunlight`). The demo deck is unchanged (7 pages).

## Undo

`git revert` of the P4k commit, then `bash deploy/pasang.sh` and `bash deploy/pages.sh`.
