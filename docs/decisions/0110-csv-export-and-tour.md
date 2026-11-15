# 0110: Download CSV on every card, and a guided tour that opens only on request

Status: accepted, 15 November 2026 (evening). Asked for by the author after a side-by-side look at competing entries: one
offers "Download CSV" and "Take the tour", another a "Get started" tutorial; this tool had neither (measured: no `csv` or
`tour` anywhere in `src/`).

## Context

Every card already holds the hourly Sun/Earth table for its site (JPL Horizons, or the in-browser engine past the frozen
tables, ADR 0104) and the horizon used (LOLA skyline or the ideal sphere). A planner or a judge who wants to check a card, or
take its hours into a spreadsheet, had no way to get those rows out. First-time visitors also had no short path through the
parts that matter: the decision, the horizon strip, the ready-made comparisons, the one-kilometre example and the validation.

## Decision

**1. Download CSV** (`src/csv.js` pure, `src/csv-ui.js` button and Blob, `config/csv.json`).

- A quiet "Download CSV" line at the foot of every card, and "Download CSV (all scenarios)" under the side-by-side table.
  Both sit below the answers, so the first screen does not move (e2e/smoke.py first-screen checks unchanged).
- Period = the card's mission period: from the card time, for the Mission check length chosen in that card (ADR 0101; 7 days
  by default). Rows = the same hourly rows as the Mission check (`periodRows`), so the yes/no columns count exactly the hours
  behind the GO / RISKY / NO-GO badge (unit test). The note next to the button names the length and follows the select.
- Columns (the file's schema, `CSV_COLUMNS`): `scenario, site, time_utc, sun_azimuth_deg, sun_elevation_deg,
  sun_horizon_deg, power, earth_azimuth_deg, earth_elevation_deg, earth_horizon_deg, earth_link, horizon, angle_source`.
  `*_horizon_deg` = the horizon used at that body's azimuth (LOLA skyline elevation, or 0 on the ideal sphere); `power` /
  `earth_link` = that body's centre is above it (`view.horizon_threshold_deg`, the same rule as the answers); `horizon` =
  `lola_skyline` / `ideal_sphere`; `angle_source` = `jpl_horizons` / `astronomy_engine`, hour by hour (a period that crosses
  the end of the frozen tables changes source on the row where it happens). Own coordinates get their own terrain skyline
  when ADR 0106 provides one.
- Built in the browser from the tables already loaded: a Blob and an `<a download>` click. No server, no request to another
  host (the smoke test still checks that). UTF-8 with a byte order mark (spreadsheet programs read the degree sign and site
  names correctly), CRLF line ends (RFC 4180), fields with a comma or quote are quoted, text that a spreadsheet would run as
  a formula gets a leading apostrophe; numbers stay numbers, `decimals` from config.
- File name = `still-in-view_<site id>_<YYYY-MM-DD>_<days>d.csv` (own coordinates: `custom_<lat>_<lon>`), several cards joined
  with `_vs_`, only `[a-z0-9._-]`, capped at `max_name_chars`.
- A status line (role=status) says the file name and the number of rows after each download, for screen readers too.

**2. Guided tour** (`src/tour.js`, `config/tour.json`).

- "Take the tour" is a quiet button in the row of tool buttons, next to "How to read this". It never opens by itself, so the
  smoke test, the screenshots and the video see the same page as before. On phones that row follows the cards (as the other
  tool buttons do since ADR 0040), so the first answer still opens the page.
- Five steps from config: the decision and the mission check badge, the horizon strip, "Try a comparison", the one-kilometre
  example, the Validation link. Every match of a step's selector gets an outline; the first is scrolled into view with a jump
  (`behavior: 'auto'`, ADR 0033). A step whose target is missing or hidden is skipped. Texts: i18n `tour.*` in en, id, ms.
- A native modal `<dialog>` pinned to the bottom corner (full width on phones): focus moves to "Next" and stays inside, Enter
  steps on, Esc / Close / Finish end it, the outline goes and focus returns to "Take the tour". No backdrop dimming, no
  animation, no `filter` / `backdrop-filter` (they crash WebKit when animated; CLAUDE.md).

## Consequences

- Two more JSON files in `config/` (what a planner may want to change without code: decimals, words in the cells, file
  name prefix; the tour's steps and targets).
- e2e/smoke.py downloads a card file and the side-by-side file on all four profiles (name has site + date, header, hourly rows,
  yes/no columns, one block per card) and walks the tour (closed on load, focus inside, Next, Esc, focus back).

## Rollback

Remove `csv: csvCfg` and the `mountTour(...)` line from `src/main.js`: with `csv = null` the cards draw no CSV line and the
side-by-side table no button; without `mountTour` there is no tour button. Or revert the commits of this ADR.
