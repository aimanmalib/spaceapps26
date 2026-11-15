# 0034 — Project page text and deck, before the final sweep (P4w)

Status: accepted, 15 November 2026.

## Context
The official submission guide says most of the judges' evaluation is based on the project submission. The independent review of
15 November asked for: the summary to open with the one-year finding, the Earth view as the first image of the detailed
description, five short lines (Impact, Creativity, Validity, Relevance, NASA data), a feature list that matches the live site,
the landscape one-kilometre GIF instead of the tall timeline GIF, and slides 6 and 7 cut to about 60 words each.

## Decision
- Form kit (`docs/hantar/`, not tracked): field 2 opens with the one-year shares from `data/shift-year/shift-year.json` (Earth's
  centre above the IM-2 skyline 80.1 % of hourly rows at the site, 64.4 % 1 km east, 56.6 % 1 km south), then the 2026-11-14 case,
  then what the tool is. Field 2 is one paragraph (the form drops line breaks) and stays under 1500 characters. Field 5 gets
  `docs/media/deck-cards.png` (the Earth view) first, the five lines with measured numbers only, the disc states (P4u) and the Earth
  view (P4v) in the feature list, and `one-km-example.gif` in place of `timeline.gif`. Sentences [A], [B], [C] are unchanged.
- Site links in fields 2 and 5 and on slides 1, 4 and 7 use the GitHub Pages address, the address the first submission used.
- Slide 6: one line of data sources, the four-row check table kept. The table cells are pinned to `data/validation.json` by
  `tests/test_demo.py` (including the 18.0-point ridge row with its PGDA range), so the slide is about 85 words, not 60.
- Slide 7: about 70 words plus the approved closing sentence [B]; [B] is counted apart because it is the author's approved text.
- Field 8 stays "Space agency partner data: none used" (P4h was dropped, so no JAXA/ISRO source came in).

## Undo
`git revert` the P4w commit restores the deck; the form kit has its own copy for the first submission
(`BORANG-TAMPAL-hantar1.md`, never edited).
