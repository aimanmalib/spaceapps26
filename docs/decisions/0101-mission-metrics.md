# 0101: Mission check on every card

Status: accepted, 15 November 2026 (evening). Feature asked for by the author; built by an SI worker on branch `wt/metrik`.

## Context

The cards answer "now?" for one time. The challenge also asks to "assess power generation potential and direct-to-Earth
communication windows", which is a question about a stretch of time: a lander that starts at the chosen time must live
through what follows. The window finder (Next windows) lists stretches where both bodies are up, but gives no single
judgement and no power number.

## Decision

- `src/metrics.js` (pure): over a mission period that starts at the card time (`config/metrics.json`
  `period_days_options`, default 29.5 days = one lunar day, option 14 days), on the hourly table and the horizon used by the
  card (terrain skyline or ideal sphere, centre of the disc, `view.horizon_threshold_deg`: the same rule as the answers):
  longest night (Sun below that horizon), longest gap without Earth, the share of hours with the Sun, Earth and both up, and a
  mean irradiance geometry estimate for a vertical panel that turns to face the Sun (cos elevation) and a flat panel
  (sin elevation): 1361 W/m² x geometry x share of the Sun's disc above the horizon used (straight-edge circle segment,
  radius `view.timeline.year.disc_radius_deg.sun`). Labelled "Geometry estimate, no panel efficiency".
- `decide()`: GO when Sun >= 70 % and Earth >= 50 % of the hours and the longest night <= 72 h; RISKY when one check fails;
  NO-GO when two or more fail. Limits in `config/metrics.json` `decision`. One line gives the reason (failing checks, or the
  three values when all pass).
- Card: a small badge (GO / RISKY / NO-GO, period) in the card head; a click opens "Mission check" under the answers (after
  the Earth view when there is one), with the reason, the two runs, bars for the hour shares with the limit ticks, and bars
  for the two panel estimates. The length select stays inside the block (it does not rebuild the card). Closed by default
  (`first_card_open`), so the first screen of ADR 0040 is unchanged.
- Runs that touch the period edge show "≥" (they may be longer). A period that runs past the end of the data is counted up to
  the end and says so.

## Measured (default rule, one lunar day, every day of the table)

Every listed site is NO-GO for every 29.5-day start except Shackleton connecting ridge (68 GO starts of 336): a lunar day
holds a two-week night almost everywhere. With 14 days, the Apollo and Chandrayaan-3 sites are GO for about 80 starts, IM-2
64, IM-1 66, Chang'e 4 none (Earth never in view). Screening rule for comparing sites, not a mission requirement.

## Way back

`git revert` of these commits. Without `config/metrics.json` passed from `src/main.js` (`metrics: null`) the cards show no
badge and no block.
