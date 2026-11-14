<!-- SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md -->
# 0021: Mission window finder ("Next windows") on every card (P4m)

Date: 2026-11-15. Status: accepted. No change to `data/`.

## Context

On 15 November the author asked SI to suggest features; SI suggested five and the author chose all five (recorded in
SI-DISCLOSURE.md, steps and "Who decided what"). The first of them is a mission window finder, supporting the challenge
sentence "assess power generation potential and direct-to-Earth communication windows".

## Decision

- Every card gets a "Next windows" block (open on the first card only, `config/view.json` `first_card.windows_open`).
- A window = a run of consecutive hourly table rows in which the Sun and Earth are both above the horizon used for that
  scenario (terrain skyline where a profile exists, else the ideal sphere), judged at the centre of each disc with
  `horizon_threshold_deg` — the same rule as the card answers. Start/end = first/last such row; length = end − start.
  Resolution is therefore one hour; a window touching the first/last table row is shown as "≥" its length.
- Listed: windows that end after the chosen time (a window in progress is marked), at least the chosen length
  (`windows.min_hours_options`, default `default_min_hours`), at most `max_listed`. "Use this start time" sets the card
  time through the same bubbling `change` event as the step buttons (ADR 0020).
- One computed line: the share of table hours with both above the horizon used.
- Pure functions in `src/mission.js`; unit tests compare the finder with a brute-force scan on random series and check
  every window on a real site (IM-2, terrain horizon). No data files changed; geometry only (no panel or antenna model).

## Consequences

- The site select is no longer the only `<select>` on a card: browser scripts address it as `select[id$='-site']`.
- Rollback: `git revert` of the commit + `deploy/pasang.sh`; remove the "Next windows" bullet from the form kit.
