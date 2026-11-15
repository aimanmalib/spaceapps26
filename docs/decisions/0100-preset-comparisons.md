# 0100 — "Try a comparison": five ready-made comparisons, and a rescheduling lede

Status: accepted, 15 November 2026 (evening). Asked for by the author.

## Context
The challenge text is about rescheduling: a launch slips or the site changes, and the team must see at once whether the new
date or place still has sunlight for power and a direct line to Earth. The page opened on a lede about picking a site and a
time, and a first-time visitor had to build a meaningful pair by hand. The shareable link (`?s=…`, ADR 0022) already carries
any set of cards.

## Decision
- Lede (`tool.lede`, en/id/ms): "Launch slipped or site changed? See at once whether a lunar landing site still has sunlight
  for power and a direct line to Earth."
- A row "Try a comparison" between the title and the tool, five chips, from `config/presets.json`:
  - Launch slipped two weeks: IM-2, 2026-11-17 → 2026-12-01 00:00 UTC (sunlight lost, Earth kept).
  - IM-1: planned vs where it landed: `im-1` and `im-1-landed`, 2026-11-18 00:00 (lit vs Sun behind the skyline).
  - Apollo 11 vs the south pole: `apollo-11` and `shackleton-ridge`, 2026-11-10 00:00 (night with Earth vs Sun without Earth).
  - One kilometre away: the one-kilometre example (`config/view.json` `example`, IM-2 2026-11-14 00:00); it jumps to the
    view toward Earth exactly like the example button (`jump_to_earth_view`), where the nearby points are drawn.
  - Ridge: summer vs winter: `shackleton-ridge`, 2026-11-10 and 2027-05-20 00:00 (Sun above the skyline in 100 % of the
    hours of Nov 2026, 45 % of May 2027; Earth below in both, so only the Sun changes).
  Times were chosen by scanning the frozen tables with the cards' own rule so that the two cards differ; each preset writes its
  answers in `_answers`, and `tests/presets.test.mjs` recomputes them from `data/ephem` + `data/horizon`, so a data rebuild
  that changes an answer fails the test instead of silently showing two equal cards.
- Each chip is a real link to the shareable address (other query values such as `?lang=` kept), so it opens in a new tab
  too; a plain click replaces the cards in place (no reload), writes the address with `history.replaceState`, marks the
  chip `aria-current` and writes one line in the existing `role="status"` paragraph. The example button's code was folded
  into the same `loadScenarios()` in `src/compare.js`; the button itself and its behaviour are unchanged.
- First screen (limits of ADR 0029/0033/0040 kept, measured): the row costs one line, so on the Compare page only the page
  top padding is halved and the gap above the tool shrinks; on phones the eyebrow is one step smaller and the row is one
  line that scrolls sideways (label on two short lines, so the second chip peeks in). Measured at 1366 × 768: answers end at
  761 px (limit 768); iPhone 13 WebKit: first answer starts at 659 px (limit 664). Little room is left for anything else
  above the cards.

## Not done
- The pre-existing horizon strip can draw a marker label over its corner text when a body is near the top of the scale
  (Apollo 11's Earth at 69° always is); the strip itself was not changed here.
- The example button stays next to the new "One kilometre away" chip (same action); retiring it would change ADR 0033 and
  the smoke checks, left to the author.

## Rollback
`git revert` of the commits of branch `wt/preset`, then `bash deploy/pasang.sh` and `bash deploy/pages.sh`.
