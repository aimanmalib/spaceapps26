# 0001 — Stack, data freezing and data sources

- Status: accepted
- Date: 2026-11-14

## Context

The tool must load fast on phones (including Safari/WebKit), stay online for judging months after the event, and use NASA data as
its basis. The JPL Horizons API does not send an `Access-Control-Allow-Origin` header, so a browser cannot call it directly.
Raw LOLA terrain files are 29–115 MB each.

## Decision

1. **Stack:** plain HTML/CSS and JavaScript ES modules, built with Vite (pinned exact version). No UI framework. A library is added
   only when needed, must have an OSI license, a pinned version, a line in `REFERENCES.md`, and the shipped JavaScript stays at or
   under 300 KB gzip.
2. **Frozen data:** data is fetched by scripts in `scripts/` at build time, written to `data/` with one `data/SOURCES.json` entry per
   file (`url`, retrieval time, license/credit, script, `generated_by`), and served as static files. The page makes no network calls
   to other hosts at runtime and never labels this data "live". Positions for dates or coordinates outside the precomputed tables are
   shown only if an in-browser calculation passes the Horizons comparison (validation page), and are labelled as computed in the
   browser.
3. **Sources:** JPL Horizons for Sun/Earth positions; LRO LOLA polar DEMs from PDS Geosciences for terrain. Any other source is checked
   with one request before use. Raw DEM files stay outside the repository (local cache); only small derived files enter `data/`.
4. **Configuration:** values that may change (site list, date range, time step, feature switches, labels) live in `config/*.json`
   and `i18n/en.json`, not in code. UI text is English (the submission language) and lives in `i18n/en.json` so other languages can
   be added later.

## Consequences

- The site is a folder of static files; any static host can serve it.
- Coverage is limited to what was precomputed; this is stated on the page.

## Rollback

If the in-browser calculation does not match Horizons closely enough, only the precomputed tables are used and the date range is
stated as a limitation.
