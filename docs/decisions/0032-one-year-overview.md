# 0032 — One-year overview of every listed site (P4s)

Status: accepted, 15 November 2026.

## Context
The author chose this SI suggestion on 15 November 2026 (declared in SI-DISCLOSURE.md and si-disclosure.json). It supports the
challenge wording "compare landing sites and dates quickly" and "quickly assess trade-offs". The candidate-region sites of P4h were
not added (P4h was dropped), so the overview covers the ten sites in `config/sites.json`.

## Decision
- `scripts/overview.mjs` counts the frozen hourly tables (`data/ephem`) against the horizon used (`data/horizon` LOLA skyline where it
  exists, otherwise the ideal sphere) into a NEW file `data/overview.json` (+ one entry in `data/SOURCES.json`). No existing data file
  or published number changes.
- Rule = the timeline's one-year caption: an hour counts when any part of the disc is above the horizon (disc radius from
  `config/view.json` `timeline.year`). The tests check that the file equals a fresh count, the caption (`discShare`) and, for IM-1 and
  IM-2, `data/validation.json` `pgda` (the values checked against NASA PGDA).
- Longest unbroken stretch with both = longest run of consecutive hourly rows with both counted (rows / 24 = days).
- New page `overview.html` (source `src/overview.html`, built to the site root like play/teach) with a nav link on every page.
  Column headings are buttons (keyboard), the sorted one carries `aria-sort`. Three findings are generated from the file with i18n
  templates using "most" and "longest" only; no site is ranked or recommended for landing. A note says terrain and ideal-sphere
  numbers are not like for like, and that the answers are geometry only.
- Gallery image `docs/media/overview.png` (real screenshot, `scripts/capture_media.py --overview`). README section with the same
  lines and table (tested against the file). The deck is unchanged (no room; exactly 7 pages kept).

## Rollback
`git revert` of the P4s commit + `bash deploy/pasang.sh` + `bash deploy/pages.sh`.
