<!-- SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md -->
# 0020: Sequential comparison on every card (P4i)

Date: 2026-11-15. Status: accepted. No change to `data/`.

## Context

NASA's challenge text asks for "side-by-side or sequential comparison of multiple sites to help users quickly assess
trade-offs" and for planners to "respond quickly when schedule changes … require landing date or location adjustments".
The tool had side-by-side cards only. On 15 November the author chose this option (with three others) from a list SI made of
the challenge text; the choice is recorded in `SI-DISCLOSURE.md` ("Who decided what", step 4) and `si-disclosure.json`.

## Decision

- Each card gets four step buttons under its answers: previous/next site (order = the site list; the date is kept; own
  coordinates step to the first/last listed site) and earlier/later by `config/view.json` `sequence.button_step_hours`
  (site kept). The buttons set the card's own select/time input and fire `change`, so the card updates through the same path
  as a hand edit (no second code path for answers).
- "If the date moves" (a `<details>` block; open on the first card, `first_card.sequence_open`): the chosen time and
  `sequence.table_steps` more rows `sequence.table_step_hours` apart, each with the power and direct-to-Earth answers and their
  margins from the horizon the card uses (`judge` in `src/shifts.js`, the same as the card and the small-shifts table). Rows
  whose answers differ from the chosen time are marked "changed"; one line counts the dates with each answer possible, over
  the rows inside the table. Rows past the end of the table say so and are not counted.
- Pure logic in `src/sequence.js` (unit tests `tests/sequence.test.mjs`); DOM in `src/sequence-ui.js`; smoke
  `e2e/smoke.py` `sequence()` presses the next-site button with the keyboard, steps a day, checks the table and steps back.
- Measured (README): IM-2 from 2026-11-14 00:00 UTC, solar power possible on 13 of 15 dates, direct-to-Earth on 15 of 15.

## Way back

`git revert` the P4i commit, `bash deploy/pasang.sh`, take the "Step a card…" line and the 15 November sentence back out of the
paste kit only if the disclosure moves to the next P4i–P4l slice (the disclosure rows stay while any of those options is live).
