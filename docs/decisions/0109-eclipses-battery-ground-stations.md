# 0109: Lunar eclipses at the site, battery for the longest night, ground stations

Status: accepted, 15 November 2026 (evening). Asked for by the author after a scan of 140 READMEs of other entries to the
same challenge (7 mention eclipses, 9 the Deep Space Network or ground stations, 25 batteries); built by an SI worker on
branch `wt/realisme`.

## Context

The power answer said "Solar power possible" whenever the Sun's centre was above the horizon used. That is wrong during a
lunar eclipse: seen from the Moon, Earth then passes in front of the Sun and the site loses sunlight with the Sun still
above its skyline. The Mission check gave a night length but no battery size, and "Direct-to-Earth communication possible"
said nothing about the antennas on Earth.

## Decision

1. **Eclipses** (`src/eclipse.js`, pure). The Sun–Earth angle comes from the two azimuth/elevation pairs of the same table
   row (JPL Horizons tables, then the in-browser engine after them, ADR 0104), so no new data is fetched. Disc radii =
   `config/view.json` `timeline.year.disc_radius_deg` (Sun 0.267°, Earth 0.95°, mean distances, solid Earth). Covered share
   of the Sun = overlap of two discs (flat sky). Rule, the same as for the horizon: no sunlight while the Sun's **centre** is
   behind Earth; the covered share is shown beside it and lowers the power estimate.
   - Card: when the centre is covered the answer becomes "No sunlight for solar power", the large number becomes the share
     hidden ("54 % of the Sun is behind Earth"), one line says the Sun is still above the skyline, and the timing line says
     when Earth uncovers the centre and when the eclipse ends. With only part covered the answer stays and one line gives the
     share and the end time. The card head verdict, the side-by-side table and the plain verdicts follow the answer.
   - Timeline: the Sun bar is off while the centre is covered; a dark mark with a Sun-coloured edge sits on the Sun lane and
     one line under the chart names the eclipse.
   - Mission check and Next windows: hours with the centre covered count as no sunlight (night, "both up"); the power
     estimate keeps only the uncovered share; one line gives the eclipse hours and the largest share.
   - Overview calendar: its rule is "any part of the disc" (ADR 0102). The frozen year holds penumbral eclipses only, which
     never cover the whole Sun (checked for every site), so the hour counts do not change; eclipse days get a small dot, a
     legend key and a readout line, and the cell opens Compare at the eclipse hour (`data/eclipses.json` `calendar`).
   - Preset "Lunar eclipse at the south pole": IM-2 on 17 Aug 2027, 05:00 and 07:00 UTC, inside the JPL Horizons table: the
     Sun stays 6.3° above the LOLA skyline, at 07:00 Earth covers 54 % of it, centre included.
2. **Battery**: Mission check shows "Battery for the longest night" = example load × longest night / 1000 (kWh).
   `config/metrics.json` `battery.load_w` = 100 W, labelled an example; "≥" when the night touches the period edge.
   Geometry estimate: no losses, heaters or reserve.
3. **Ground stations** (`src/dsn.js`, `src/dsn-ui.js`, technical details only): the Moon's elevation from Goldstone (DSS 14),
   Madrid (DSS 63) and Canberra (DSS 43) at the card time, against `config/dsn.json` `min_elevation_deg` (10°, an example);
   when none is above it, the first one that will be, within 24 h. Coordinates copied from NASA/JPL DSN Telecommunications
   Link Design Handbook 810-005, module 301 Rev. N, Table 5 (WGS 84), https://deepspace.jpl.nasa.gov/dsndocs/810-005/301/301N.pdf.
   Astronomy Engine geocentric Moon, no refraction; the engine chunk loads only when the details open.

## Checked against NASA

`scripts/eclipses.mjs` scans every listed site from 2026-11-01 to 2031-01-01 (Horizons table, then the engine) and matches
each stretch of hours with part of the Sun behind Earth to the NASA GSFC list copied into `config/eclipses.json`
(https://eclipse.gsfc.nasa.gov/LEdecade/LEdecade2021.html, https://eclipse.gsfc.nasa.gov/LEcat5/LE2001-2100.html):
10 lunar eclipses in that range. Measured 15 Nov 2026, 18 sites: 142 stretches, 0 without a NASA eclipse within 2 h of its
greatest eclipse (largest gap 1.4 h, mean 0.5 h; rows are hourly); every partial and total eclipse seen at all 18 sites;
the three totals cover the whole Sun at all 18 sites, penumbral ones never do; 2027-07-18 (penumbral magnitude 0.0014) is
seen at no site. Result `data/eclipses.json`; `tests/eclipse.test.mjs` fails if this changes or the site list grows without
a rerun. One complex sees the Moon above 10° in 97.9 % of the hours of November 2026 (`tests/dsn.test.mjs` asks ≥ 90 %).
The Moon's elevation from the three antennas at 2027-08-17 07:00 UTC agrees with JPL Horizons (observer at the same
geodetic coordinates, airless) within 0.001° (Goldstone 40.023°, Madrid −16.697°, Canberra −6.671°; unit test).

## Not modelled

Earth's distance changing (its disc is 0.90° to 1.03° across, so contacts can move by minutes), the ring of sunlight bent
through Earth's atmosphere, eclipses shorter than one hourly row in the timeline/Mission check (the card uses its own
minute), antenna masks and schedules of the DSN, battery losses.

## Way back

`git revert` of the `wt/realisme` commits. Smaller steps: drop the `withEclipses`/`eclipseAround` lines in `src/compare.js`
(cards and blocks go back to the horizon only); remove `battery` from `config/metrics.json` (no battery line); remove the
`mountDsn` line in `src/compare.js` (no ground station line); `calendar` missing from `data/eclipses.json` = no calendar dots.
