# 0009 — Full site list (item a) and timeline of one lunar day (item g)

- Status: accepted
- Date: 2026-11-14

## Context

Item a asks for known landing sites (Apollo, CLPS targets, other national programs); item g for a timeline or animation of the
Sun and Earth movement. ADR 0003 started with five sites. Every coordinate must come from a cited page, and every site needs a frozen
Horizons table (no CORS, ADR 0001).

## Decision

1. **Sites** (`config/sites.json`): add Apollo 12, 14, 15 and 16 (Lunar Module positions from the same NSSDCA table as Apollo 11 and 17,
   so all six Apollo landings are present) and Chang'e 4 (LROC page 1100, coordinates from the LROC NAC stereo model; a far-side site).
   Ten sites in three groups; the site menu shows the groups (`<optgroup>`, labels in `i18n/en.json`). Tables fetched with the same
   script and request shape (`scripts/fetch_horizons.py`), about 65 KB gzipped each, loaded only when a card uses the site.
   Still not included, for lack of a public page with printed coordinates found in time: Artemis III candidate regions, Shackleton ridge.
2. **H9(a) re-run** over all ten sites (5 pairs per site, same seed; `max_pairs_total` raised to 60). Adding sites changes the random
   draw for the existing sites too, so the pairs and numbers in `data/validation.json`, the README and the Validation page all change together.
3. **Timeline** (`src/timeline.js` pure + `src/timeline-ui.js` controls): per card, an SVG chart of Sun and Earth elevation above the
   horizon actually used by that card (terrain skyline for LOLA sites, ideal sphere otherwise) over one lunar day
   (`config/view.json` `timeline.span_days` = 29.53, rounded to whole table steps), bars for "in view", a vertical line at the chosen time.
   The span stays fixed while the time moves inside it, so scrubbing and Play do not shift the axis.
   - Scrubber (`<input type=range>`) and Play live outside the redrawn result, so keyboard focus survives redraws.
   - Play advances the card time by `play_step_minutes` every `play_interval_ms`; it is **hidden** when
     `prefers-reduced-motion: reduce` matches (the slider still works). No CSS animation is used.

## Consequences

- Rollback: set `g_timeline` false in `config/features.json` (cards render without the timeline); remove sites from `config/sites.json`
  and their `data/ephem/` files + SOURCES entries, then re-run `scripts/validate.py`.
- Smoke test (`e2e/smoke.py`) checks the timeline on every card, the scrubber, Play/Pause and the reduced-motion rule.
