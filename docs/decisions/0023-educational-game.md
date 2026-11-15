<!-- SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md -->
# 0023: Educational game page "Play" (P4j)

Date: 2026-11-15. Status: accepted. No change to `data/`.

## Context

Option A of the four further options from the challenge text that the author chose on 15 November (declared in
SI-DISCLOSURE.md and `si-disclosure.json` with P4i, ADR 0020). NASA's wording: "Your solution might be a web application,
a mobile app, an interactive visualization, an educational game, or another format entirely". Built as small as that
sentence allows: the two questions the tool already answers, no story, no new data.

## Decision

- New page `/play.html` (nav link "Play" on every page; source `src/play.html` because the repo file scope covers `src/` and
  not new root files: `vite.config.js` serves it at `/play.html` in dev and moves the built page to `dist/play.html`), `src/play-main.js` (page) + `src/game.js` (pure functions).
- A round = one listed site + one UTC time from `config/game.json`. The config holds no answers: `roundAnswers` samples the
  same frozen table (`data/ephem/`), uses the same terrain skyline where one exists (`data/horizon/`) and the same judgement
  as the Compare page (`judge` in `src/shifts.js`, `horizon_threshold_deg`). `tests/game.test.mjs` checks every configured
  round against that judgement and that the rounds mix yes/no for both questions and terrain/ideal-sphere sites.
- Six rounds, chosen by running the engine over candidate times: Apollo 11 (both up, far from the horizon), Chang'e 4 (far
  side: Earth below), IM-2 2026-11-14 (Earth 1.3° above the skyline, Sun below), Chandrayaan-3 (Sun 0.1° below), IM-2
  2027-05-18 (Earth 0.7° below the skyline), IM-2 2026-12-05 12:00 (both below).
- After Check: right/wrong in words (not colour only), the real answer, one computed sentence per question (elevation, horizon
  in that direction, margin), the horizon picture (`skySvg`, shared scale rule), a link `./?s=<site>,<time>` (P4n format)
  to the same scenario in the tool. Score out of 2 × rounds. No timer, account, storage, sound or motion; native radio buttons
  and buttons (keyboard), focus moves to the marks after Check and to the round heading after Next.
- Gallery image `docs/media/play.png` (`scripts/capture_media.py --play`): round 1 after Check.

## Undo

`git revert` the P4j commit, `npm run build`, `bash deploy/pasang.sh`; remove the "Play" bullet and the `[IMAGE: play.png]`
lines from the submission kit and measure §5 again.
