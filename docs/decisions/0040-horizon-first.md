# 0040: Horizon first: a verdict and a 360° strip open every card

Status: accepted, 15 November 2026 (evening). Adopted by the author from an SI red-team review of the entry.

## Context

The review measured the first screen: on an iPhone 13 there was no picture and the first answer was cut by the bottom edge; on a
1366 x 768 laptop the first picture (the view toward Earth, ADR 0029) began at the fold. The challenge asks for a tool that
visualises the Sun and Earth relative to the horizon, so the horizon should be the first thing seen.

## Decision

- `src/pano.js`: each card's result now starts with one short verdict (four sentences, `pano.verdict.*`, chosen by the same two
  answers as the card) and a strip of the whole horizon, 360° wide: sky, ground, the Sun and Earth. At IM-1 and IM-2 the ground
  is the LRO LOLA skyline with the smooth-Moon line dashed; elsewhere it is the ideal sphere. A marker is hollow when that body
  is below the horizon used (same judgement as the answers).
- Vertical scale: the smallest step of `config/view.json` `pano_scale_steps_deg` (5, 10, 20, 45, 90) that holds that card's own
  Sun and Earth elevations, written in the strip's corner. Each card zooms on its own; the larger panorama further down keeps
  the scale shared by all cards.
- The strip is stretched to the card width, so only shapes are SVG; markers, labels and compass letters are HTML placed in
  per cent (round markers stay round, text stays readable at 320 px).
- Room for it: the list of verdict sentences moves under the cards on every width (above the side-by-side table; each card
  carries its own verdict now); wide windows keep the validation line and buttons above the cards. On phones the main buttons
  follow the cards. The intro sentence is shorter.
- Measured (WebKit iPhone 13, 664 px first screen): verdict 509 px, strip 539 to 620 px, first answer from 632 px. Chromium
  1366 x 768: strip 479 to 571 px, both answers end at 756 px. `e2e/smoke.py` checks these limits; the earlier limit on the
  view toward Earth (ADR 0029) is dropped: that view now starts just below the first screen on a laptop.

## Way back

`git revert` of this commit, then `bash deploy/pasang.sh` and `bash deploy/pages.sh`.
