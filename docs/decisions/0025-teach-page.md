<!-- SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md -->
# 0025: Page for teachers "Teach" (P4o)

Date: 2026-11-15. Status: accepted. No change to `data/`.

## Context

One of the features suggested by SI at the author's request on 15 November and chosen by the author (declared in
SI-DISCLOSURE.md and `si-disclosure.json` with P4m). NASA's wording: "an educational tool to help students and the public
understand lunar exploration challenges". Built as small as that allows: one activity that uses the game (ADR 0023) and the
Compare tool; no new data, no claim about learning outcomes, classroom use, curricula or users.

## Decision

- New page `/teach.html` (nav link "Teach" on every page). Source `src/teach.html` for the same file-scope reason as the
  game; `vite.config.js` now lists both under `SRC_PAGES` and moves them to the site root.
- `config/teach.json` holds the steps (key, suggested minutes, the game page or scenarios) and the Moon and Earth rows to show.
  The heading's total (15 minutes) is the sum of the steps. Step texts in `i18n/en.json` (`teach.*`); placeholders are filled
  from config (`shift.heading`, `config/shifts.json` 1 km, `config/ephemeris.json` dates).
- No answers on the page: each step links to the game or to the tool (P4n link format, decoded by the same function as the
  Compare page). `tests/teach.test.mjs` checks the links round-trip, the times lie in the frozen tables, the 1 km step uses a
  site with a terrain skyline, and that no degrees are written in the steps.
- Moon and Earth rows (item k): day length and air pressure quoted from `config/moon-earth.json`, horizon distance computed with
  `horizonKm`, the same as the per-card block.
- Print: a "Print this page" button calls the browser's print; the print style hides the navigation and buttons, uses black on
  white and shows every link as a full address.

## Undo

`git revert` the P4o commit, `npm run build`, `bash deploy/pasang.sh`; remove the "Teach" bullet from the submission kit
(`BORANG-TAMPAL.md` + `teks.md`) and measure §5 again.
