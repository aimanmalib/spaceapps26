# 0033 — "Show me the one-kilometre example" button (P4p)

Status: accepted, 15 November 2026.

## Context
The author chose the SI suggestion "a guided tour" on 15 November 2026 (declared in SI-DISCLOSURE.md and si-disclosure.json). The
independent review the same morning cut it down to ONE button that loads the one-kilometre case and scrolls to the view toward Earth,
plus a landscape GIF; no multi-step tour. That is what was built.

## Decision
- The case lives in `config/view.json` `example` (IM-2, 2026-11-14 00:00 UTC), the same scenario as the teachers' page step `km`, the
  README link and `e2e/smoke.py` `ONE_KM_QUERY`; `tests/example.test.mjs` checks all four agree and that the site has a LOLA skyline
  and nearby points (so the Earth view exists).
- The button sits first in the row above the cards (`index.html`, text `tool.example` in `i18n/en.json`). Pressing it replaces the
  cards with that one scenario, puts the matching shareable link in the address (`history.replaceState`, no reload), writes one line
  in a `role="status"` paragraph, moves focus to the Earth view title and scrolls there (`behavior: auto` under
  `prefers-reduced-motion`). If the Earth view is absent, it scrolls to the card. The button stays hidden when `example` is missing.
- Gallery GIF `docs/media/one-km-example.gif` (1280 × 720, real capture, `scripts/capture_media.py --example`, settings in
  `config/media.json` `example_gif`): first screen, the page after the button, then the Earth view from each nearby point.
- First screen trade-off: on a 390 px phone the five buttons of that row need three rows, not two. The iPhone 13 smoke limit for the
  top of the first answer moves from 664 px to 720 px (one button row below the fold), and a new smoke check requires the example
  button itself to end inside the first screen on all four profiles. The 1280 and 1366 limits are unchanged and still pass.
- No new data, numbers or claims; the status line only names the case and the point buttons.

## Rollback
`git revert` of the P4p commit + `bash deploy/pasang.sh` + `bash deploy/pages.sh`.
