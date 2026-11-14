# References

Every data set, library, tool and quoted text used in this project. Data provenance per file: `data/SOURCES.json`.
This list is completed as each part is built.

## Challenge

- NASA Space Apps Challenge 2026, "Lunar Landing Site Navigator" —
  <https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/> (challenge text quoted in README.md).

## NASA data

- JPL Horizons System (Solar System Dynamics, JPL/Caltech/NASA), API — <https://ssd.jpl.nasa.gov/api/horizons.api>.
  Planned use: Sun and Earth azimuth/elevation seen from lunar surface sites, precomputed at build time.
- LRO Lunar Orbiter Laser Altimeter (LOLA) gridded topography, PDS Geosciences Node —
  <https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img/>.
  Planned use: terrain horizon for south polar sites.

## Libraries and tools

| Name | Version | License | Use |
|---|---|---|---|
| Vite | 8.3.8 | MIT | build tool (not shipped to the browser) |
| Node.js | 22 | MIT | build and tests |
| Python | 3 (standard library) | PSF | data scripts and tests |
| Claude Code (Anthropic) | — | — | SI tool; see SI-DISCLOSURE.md |

## Fonts and images

None yet. The page uses system fonts. No NASA logos, flags or mission insignia are used.
