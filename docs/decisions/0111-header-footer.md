# 0111: Site header brand and footer (the same mark, name and link groups on every page)

Status: accepted, 15 November 2026 (evening). Asked for by the author as the last finish before the entry closes: a header and a
footer that read as one product on all seven pages, in the design of ADR 0107.

## Context

The seven pages started with the page-link row alone; the name of the tool appeared only as a small line above each page title
(with the mark of ADR 0107) and as the Compare page title. The footer was one or two lines of text (SI sentence, licence word,
an identity line with the team, source code and slides) that wrapped differently on each width. There was no place that listed
every page, the scientific checks and the project links together.

## Decision

- **Header:** the mark of ADR 0107 (the Sun and Earth above a lunar horizon), drawn once as inline SVG, and the name "Still in
  View" go first in the existing page-link row, as a link to Compare. Same row, same height: the row is 56 px on a 1366 × 768
  laptop and 52 px on an iPhone 13 before and after (measured), so the first-screen limits of `e2e/smoke.py` are unchanged.
  On phones the row still scrolls sideways (ADR 0107); the brand stays pinned at its start and the links fade out under it.
  The current page keeps its pill and gets a small Sun-yellow dot. Under 360 px only the mark shows; the name stays for screen
  readers.
- **No repeated name:** with the brand in the header, the line above each page title that only repeated "Still in View" is
  hidden, and the eyebrow on Compare (the event line) no longer carries a second mark.
- **Footer:** the brand and a one-line description (`meta.description`), then three groups: Product (Compare, Overview, Play,
  Teach, About), Science (Validation, Data sources, the README section "What a scientist can check") and Project (source code,
  slides, licence Apache-2.0, SI disclosure, the data credits NASA LRO LOLA, JPL Horizons and NASA PGDA, and the team and
  event line). Below a rule: the page's own footer lines (the SI sentence; the NASA photo credit on Compare) and the language
  switcher. On phones each group is one line of text (its name, then its links) that wraps only when it must.
- **Where it lives:** `src/frame.js` (built by `initPage` in `src/page.js` on every page, so the seven HTML files are not
  edited and other page work near the header does not collide with it), `src/frame.css` for the footer, the header rules next to
  `.topnav` in `src/styles.css` so the brand is styled on the first paint. Links and their order: `config/frame.json`; all text:
  i18n keys `footer.*` in English, Indonesian and Malay. `tests/frame.test.mjs` checks the keys in every language, that every own
  link points at a page or file that exists, that the README anchor is a README heading, and that the SI disclosure link is
  there once.
- The identity line of the old footer (`footer.entry`, `footer.team`, `footer.code`) is replaced by the groups; its keys are
  removed.

## Fixed values (CLAUDE.md)

1. Three languages from the start: every label is an i18n key in `i18n/{en,id,ms}.json`.
2. Product-grade UI: checked by eye on Compare, Overview and Validation in Chromium 1366 × 768 and WebKit iPhone 13 (before and
   after shots), no horizontal overflow, keyboard focus as before (`.foot a:focus-visible`, `.topnav a:focus-visible`).
3. Change without code: link list and order in `config/frame.json`, addresses from `config/app.json`, text in the i18n files.
4. Small module, decision recorded here, way back below.

## Rollback

Revert the commits of this ADR, or remove the `mountFrame(...)` line from `initPage` in `src/page.js`: the pages fall back to
the static footer lines of each HTML file (SI sentence and link, licence, photo credit) and the plain page-link row with the
eyebrow and its mark (those rules only apply when the brand is present).
