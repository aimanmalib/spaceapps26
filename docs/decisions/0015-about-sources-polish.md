# 0015 — About, Limitations and Data sources pages; disclosure and contrast checks

- Status: accepted
- Date: 2026-11-14

## Context

PRD §2c asks for every item not fully built to be listed under "Limitations" by letter, in the README and on an About page;
§6 P2 asks for a "Data sources" page; K9 asks for an SI header in every generated source file, a `si-disclosure` meta tag and a
footer link; H6 forbids SI media, NASA logos and company names; the house rules ask for contrast ≥ 4.5:1, measured.

## Decision

- Two more static pages built by Vite: `about.html` (challenge text quoted, items a–l with one line each, Limitations, how SI was
  used) and `sources.html` (every file in `data/SOURCES.json`, every site coordinate with the page it was copied from, the
  NSSDCA fact sheets). The four pages share one navigation and one start function (`src/page.js`).
- About is driven by data, not markup: items come from `config/features.json` in order (an item switched off shows
  "not built — see Limitations"), text from `i18n/en.json` key `about.item.<feature>`; limitations are every key starting with
  `about.lim.` in file order, so one can be added or removed by editing the text file only. `{start}`, `{stop}`, `{max}` come from
  `config/ephemeris.json` and `config/view.json`.
- Data sources renders the same `data/SOURCES.json` the build copies, as a list of cards (not a table: request URLs are long and
  must not widen the page at 320 px). Long URLs are shown as host + path and link to the full request.
- `config/features.json` `d_date_time` is now true: the date and time input has existed since P1 and the browser smoke test
  changes it on every run; About would otherwise mark item d "not built".
- Checks: `tests/test_disclosure.py` (SI header in the first lines of every code file, meta tag + footer link on every page, media
  files only under `docs/media/`; company names are checked outside the repository, so the list itself is not published) and `tests/contrast.test.mjs` (every text colour token on every background
  token, WCAG 2.x formula). The smoke test opens both new pages in all three profiles.

## Consequences

- Text for the new pages is in `i18n/en.json` only (EN; BM is out of scope for this build, PRD §4).
- Rollback: remove the two pages from `vite.config.js` and the navigation; nothing else depends on them.
