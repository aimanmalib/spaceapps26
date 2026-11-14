<!-- SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md -->
# 0018: Demo deck rewritten as a story (P4a)

Date: 2026-11-14. Status: accepted.

## Context

The pre-submission review (stage 4 of the submission process, 14 November 2026) found that the deck read as a checklist: the
first screenshot was too small to read, slide 2 announced the choice of "all twelve items" instead of the problem, the measured
1 km finding was the third bullet of slide 4, and the 18.0 percentage-point PGDA difference had no context.

## Decision

- `demo/slides.html` follows the review's storyboard: title with two readable scenario cards, the problem (challenge text quote),
  what you see, the measured 1 km finding, one lunar day with real terrain, NASA data and checks, who it is for and its limits.
  Still exactly 7 slides, 16:9, same path `demo/demo.pdf`.
- Readable crops for the deck (`docs/media/deck-cards.png`, `deck-compare.png`, `deck-timeline.png`) come from the live site by
  `scripts/capture_media.py --deck`; their selectors live in `config/media.json` "deck_png". The six gallery files are unchanged.
- Every number on the slides is tested (`tests/test_demo.py`) against `data/validation.json` (Horizons, engine, PGDA at IM-1/IM-2
  and at the ridge point with its 51.0–84.7 % window) or the README (1 km shifts, the IM-2 Earth elevation range).
- Two sentences were drafted by the review, not translated from the author's notes: [A] (IM-2 landing context, from a NASA news
  release, cited in REFERENCES.md) and [C] (next steps). They carry `data-owner-check="A"` / `"C"` in the deck source so they can
  be removed in one edit if the author objects before Sunday 15 November 12:00 MYT; silence means they stay (review §9).

## Way back

`git revert` this commit and re-render: the previous deck (`047a6f4`) met every submission rule.
