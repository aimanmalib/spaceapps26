# 0003 — Initial landing sites and frozen Sun/Earth tables

- Status: accepted
- Date: 2026-11-14

## Context

The core of the challenge is comparing landing sites and dates by where the Sun and Earth sit relative to the horizon.
JPL Horizons gives azimuth and elevation for an observer on the lunar surface, but its API sends no CORS header, so the
browser cannot call it (ADR 0001). Each site coordinate must come from a cited NASA source.

## Decision

1. **Initial site set** (`config/sites.json`, item a): Apollo 11 and Apollo 17 (NASA NSSDCA lunar landing sites table),
   IM-1 Odysseus and IM-2 Athena (CLPS; LROC pages), Chandrayaan-3 Vikram (ISRO; LROC page). Two sites are south of 80°S.
   Each entry keeps the source URL and the coordinate text exactly as printed there.
   - IM-1: the LROC page prints the *nominal landing area* (80.2°S, 1.0°E), not the touchdown point; the site name says so.
   - IM-2: the LROC flip-book prints the actual landing point (84.7906°S, 29.1957°E).
   - No public page with printed coordinates was found in time for the Shackleton "connecting ridge" or the Artemis III
     candidate regions, so they are not in the set. More sites can be added to `config/sites.json` and fetched with the same script.
2. **Tables** (`scripts/fetch_horizons.py` → `data/ephem/<site>.json`): Sun (10) and Earth (399), `QUANTITIES='4'`
   (apparent azimuth/elevation, no atmosphere), `COORD_TYPE='GEODETIC'`, altitude 0 km, from 2026-11-01 to 2027-11-01 UT every
   60 minutes, rounded to 0.01°. One year covers about twelve lunar days and a full cycle of the seasons; one hour keeps each
   site under 250 KB (about 65 KB gzipped). Range, step and rounding live in `config/ephemeris.json`.
   Elevations are relative to the ideal-sphere horizon; the terrain horizon (item j) is a separate step.
3. **Check point** (`data/check/`): one unnamed point (222.69°E, 89.45°S, 2026-11-14 00:00 UT) measured before the build
   (Sun elevation +1.50°, Earth −5.04°). The frozen table reproduces it (Sun az 263.91° el +1.50°, Earth az 136.05° el −5.04°)
   and a unit test keeps it that way, so a change to the request shape cannot go unnoticed.
4. **Provenance:** every file under `data/` has an entry in `data/SOURCES.json` with the request URLs, retrieval time,
   credit, script and `generated_by`; `tests/test_config.py` fails otherwise.

## Consequences

- Dates outside 2026-11-01 … 2027-11-01 are not covered by the tables; the interface must say so rather than extrapolate.
- Re-running the script overwrites the tables and refreshes `retrieved_at`.
