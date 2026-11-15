# 0029 — First screen on a 1366 × 768 laptop (P4v, part 2)

Status: accepted, 15 November 2026. Layout only, from the independent review (P4v items 2 and 4); design and code by SI
(SI-DISCLOSURE.md). No data file changes, no new numbers: the validation line reads `data/validation.json` as published.

## Context
At 1366 × 768 the first screen showed the title, the intro and the start of card 1. The verdicts and the main buttons were
about 5400 px down, the Earth view started at 1041 px, and nothing on the first screen said the angles had been checked.

## Decision
- Page order: title + intro → one verdict per scenario → one validation line → Add / Now / Copy link + "How to read this" → cards.
  The validation line (`src/trust.js`) fills in the JPL Horizons block (random times, largest difference, same answers) and the
  PGDA Sun maximum (18.0 percentage points, so the weaker number is shown next to the strong one) and links to Validation.
- The "Compare landing sites and dates" heading stays for screen readers only; the intro moves into the masthead and, at ≥ 75rem,
  sits beside the title. The Compare page uses up to 82rem of width at that size (other pages keep 72rem).
- Cards are size containers: at ≥ 28rem of card width, site and time share one row and the two answers sit side by side.
- The Horizons-elevation/skyline line and the window length fold under each answer ("Elevation and window length"), closed by
  default; the Earth view underneath carries the picture. Every number is still in the card (unit test).
- Below 60rem the verdict lines (text only, nothing to focus) and the validation line are drawn under the cards with CSS `order`
  so the iPhone 13 first-screen limit holds (first answer at 649 px, as before). The buttons stay before the cards in both
  reading and visual order. This is a known reading-order difference on phones, kept small on purpose.
- `e2e/smoke.py` gains a Chromium 1366 × 768 profile: both answers end ≤ 768 px and the Earth view plot starts ≤ 748 px
  (measured 674 / 729 on localhost). The 1280 and iPhone limits are unchanged.

## Undo
`git revert` the P4v part 2 commit, `npm run build`, `bash deploy/pasang.sh`; the Earth view and the default pair (part 1) stay.
