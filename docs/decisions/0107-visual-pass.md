# 0107: Visual pass (one self-hosted typeface, a type scale, the decision first in every card, one-row page links)

Status: accepted, 15 November 2026 (evening). Adopted by the author after a side-by-side look at competing entries: on science
and features this tool was ahead, on first impression and finish it was behind (system font, every label in yellow capitals,
page links wrapping onto two lines on phones).

## Context

The pages used the device's system font, about fifteen ad hoc text sizes, and Sun yellow for many unrelated things: section
labels, card titles, table headings, outlined buttons, pressed toggles and the validation numbers. On a phone the seven page links
took two lines above the title. Inside a card the scenario name (yellow capitals) competed with the mission check badge
(GO / RISKY / NO-GO, ADR 0101), which is the decision the card exists to give.

## Decision

Refinement only: same dark page, same layout and copy, Sun yellow and Earth blue keep their meaning.

- **Typeface.** IBM Plex Sans 3.201, variable weight 100–700, Latin subset, served from the site itself
  (`public/fonts/ibm-plex-sans-latin-wght.woff2`, 45.7 KB, `font-display: swap`). SIL Open Font License 1.1; the licence ships
  next to the file (`public/fonts/OFL-IBM-Plex-Sans.txt`) and is named in NOTICE and REFERENCES.md. Its digits all have the same
  width, and `html` also asks for `tabular-nums`, so angles, times and table columns line up. Characters outside the subset
  (→ ≥ ▼) and a failed load fall back to the old system stack. No request to another host (e2e/smoke.py still checks it).
- **Type scale.** Every font size in `src/styles.css` is a token or a heading clamp: `--fs-2xs` 11 px chart labels, `--fs-xs` 12,
  `--fs-sm` 13 helper text, `--fs-md` 14 labels and tables, `--fs-h4` 15 small headings, 16 body, `--fs-lead` 17 lead. Weights:
  400 text, 500 labels, 600 answers and headings, 700 the page title and the mission check badge.
- **Colour carries meaning.** Yellow is the Sun, the one main action per row (filled button) and the keyboard focus ring.
  Section labels, card titles and table headings are sentence case in the text or muted colour. Pressed toggles (timeline range,
  Earth view) are filled in the text colour like the selected comparison chip and the calendar segment. Validation numbers are in
  the text colour.
- **The decision first in every card.** The mission check badge is the loudest mark in the card head (15 px bold, state colour on
  a tint of itself, ring around its dot); the scenario name steps back to 13 px in a new `--quiet` colour; the verdict line under
  the fields stays the largest text in the card. Helper text under the answers and chart captions use `--quiet` (#8f97a1):
  6.0:1 on the card, 5.9:1 on the sky strip, 6.6:1 on the page. `tests/contrast.test.mjs` now checks `--quiet` with the other
  text colours (≥ 4.5:1 on every background).
- **Page links on one row.** Every width: one row of links; when it does not fit (phones, longer Malay and Indonesian names) the
  row scrolls sideways inside its own box with a fade at the right edge, and `revealCurrentLink` (`src/page.js`) scrolls that row
  (never the page) so the current page's link is in view. The current page is a filled pill.
- **The same surfaces on every page.** Cards, validation tiles, source entries, teaching steps, game questions, chart frames and
  the calendar readout share one quiet edge (`--line-soft`) and a faint top light. Text selection is Earth blue, the caret Sun
  yellow, scrollbars and native controls dark (`color-scheme: dark`).
- **WebKit traps kept out** (CLAUDE.md, lensa-ge16): no animated `filter` or `backdrop-filter`, no CSS `perspective()`. The fades
  are static `mask-image` gradients; the only transitions are colour and border colour on the comparison chips.

## Fixed values (CLAUDE.md)

1. Languages: no new text; English, Indonesian and Malay pages keep their strings in `i18n/`. The one-row page links were
   checked with the longer translated names (smoke: every page in Indonesian and Malay).
2. Product-grade UI: checked in Chromium 1366 × 768 and WebKit iPhone 13 (before/after screenshots, Compare and Overview), and in
   the four smoke profiles.
3. Change without code: every colour, size and weight is a custom property in `:root` of `src/styles.css`; the font is one file
   in `public/fonts/`.
4. Long-term: small commits, this record, and the rollback below.

## Rollback

Revert the visual-pass commits. Removing only the font: delete `public/fonts/` and the `@font-face` block; the `--font` stack
falls back to the system fonts with no other change.
