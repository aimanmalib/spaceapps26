# 0035: README opening for public readers (P4)

Status: accepted, 15 November 2026.

## Decision

The repository is public and the first submission links the GitHub Pages copy. The README now opens with: the "Try it" line
(Pages address first, `spaceapps26.aimanmalib.com` as the mirror, on the same line so the gate's "first line = live site" check
still holds), one sentence on what the page does, the challenge line and team, one image (the view toward Earth at IM-2,
`docs/media/deck-cards.png`), the one-kilometre finding with the measured numbers already in the README and `data/shift-year/`,
the one-kilometre GIF, a two-line validation summary (numbers from `data/validation.json`, already quoted further down), three
commands to run it locally, and a pointer to the AI disclosure. "Status" is renamed "Features"; every section below it, and every
number the tests lock, is unchanged.

## Style check

`python3 -m gilap sumbang --gaya README.md` reports two findings that are kept on purpose:

- "power": the word is on the Malay phrase list, but here it is English and comes from NASA's challenge text ("power generation
  potential"); `tests/test_validation.py` locks the line "Same solar power answer: … of …".
- "NSSDCA": the name of the NASA archive whose fact sheets and landing-site page are cited.

Em dashes in sentences were removed (challenge quote attribution, Tests list).

## Rollback

`git revert` this commit, then `bash deploy/pasang.sh` and `bash deploy/pages.sh`.
