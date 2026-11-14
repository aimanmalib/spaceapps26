# 0012 — Moon and Earth compared (item k)

Date: 2026-11-14 · Status: accepted

## Context

Item k of the challenge list is "differences between conditions on the Moon and Earth". No further wording was given, so this is
the smallest reading that stays on the challenge sentence (Sun and Earth relative to the horizon, power, direct-to-Earth link):
quoted NASA values plus numbers measured from the data the card already has. No new claims.

## Decision

- **Where:** a closed-by-default block "Moon and Earth compared" in every card, under "Small shifts". Redrawn only while open.
- **Rows (Moon | Earth):** length of one day (synodic period 29.53 days | length of day 24 h); Sun speed across the sky (measured at
  the site and chosen time from the card's own table, as the angle between the two hourly table directions around that time | 360°
  in one day); surface air pressure (quoted text); distance to the horizon from `observer_height_m` (2 m) above a smooth sphere of
  each radius (√((R+h)² − R²)).
- **Earth in the site's sky:** one sentence with the azimuth range (smallest arc holding every value) and elevation extremes over
  the whole table, and Earth's measured speed at the chosen time.
- **Quote:** the challenge's own sentence on the horizon without atmospheric refraction, with its link.
- Quoted values and their sources live in `config/moon-earth.json`; the page computes the rest (`src/moonearth.js`, pure, tested).
  Values were read from the NSSDCA fact sheets and the challenge page on 14 November 2026.

## Consequences

- Measured over 2026-11-01 to 2027-11-01: IM-2 Earth azimuth range 16.15°, elevation −2.30° to +10.79°; Apollo 11 37.72°,
  +57.96° to +73.68°. Sun speed at both sites on 2026-11-14 00:00 UTC: about 0.5° per hour (mean over one lunar day 0.51°).
- Earth-side numbers are reference values only (no Earth site is modelled).
- Undo: set `k_moon_vs_earth` to false in `config/features.json`; delete `src/moonearth*.js` and `config/moon-earth.json`.
