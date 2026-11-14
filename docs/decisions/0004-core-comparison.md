# 0004 — Core comparison view (tier T0)

- Status: accepted
- Date: 2026-11-14

## Context

Tier T0 is the challenge sentence itself: pick a site and a date/time, show the Sun and Earth relative to the horizon, read off
solar power potential and direct-to-Earth communication, and compare at least two cases. One tool serves all three audiences: a
plain-language answer first, technical numbers on request.

## Decision

1. **Scenario = one site + one UTC date/time.** Cards sit side by side (grid; one column on phones). The number of cards and the
   starting cards come from `config/view.json` (`max_scenarios`, `default_scenarios`).
2. **Positions** are read from the frozen hourly JPL Horizons table of the site (`data/ephem/<site>.json`, fetched from the same
   origin only, one request per site, cached) and linearly interpolated between hours; azimuth is interpolated the short way round
   north. Times outside the table show the available range instead of a value. The data is labelled "precomputed from JPL
   Horizons", never "live".
3. **Above the horizon** = elevation strictly greater than `horizon_threshold_deg` (0° = ideal sphere horizon) for the centre of
   the body. Local terrain (LOLA) is tier T1 and is stated as not included on the page.
4. **Answers:** Sun above the horizon → "Solar power possible"; Earth above the horizon → "Direct-to-Earth communication
   possible"; each with the elevation in degrees. These are the two quantities the challenge sentence names; no other score.
5. **Horizon panorama:** inline SVG, azimuth 0–360° left to right (north at both edges), elevation within ±scale°. All cards share
   one vertical scale: the smallest step in `elevation_scale_steps_deg` that fits every shown elevation, so cards can be compared
   by eye. Bodies below the horizon are drawn hollow and dashed (shape, not colour alone). Text labels are HTML, not SVG text, so
   they stay readable at 320 px.
6. **Build:** Vite copies `data/` into `dist/data/` unchanged (`vite.config.js`), so the deployed site serves the same files that
   `data/SOURCES.json` describes.

## Consequences

- Near the poles the Sun and Earth stay within a few degrees of the horizon, so the shared scale is ±10° there; when a near-side
  equatorial site is compared, the scale widens and polar markers sit close to the line. The technical table always gives the
  exact numbers.
- The Sun's disc (about 0.27° radius) is not modelled in T0: "above" is for the centre.

## Rollback

The view reads only `config/view.json` and the data files; reverting this ADR's commit returns the page to the placeholder.
