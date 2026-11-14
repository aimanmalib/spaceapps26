# References

Every data set, library, tool and quoted text used in this project. Data provenance per file: `data/SOURCES.json`.
This list is completed as each part is built.

## Challenge

- NASA Space Apps Challenge 2026, "Lunar Landing Site Navigator" —
  <https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/> (challenge text quoted in README.md).

## NASA data

- JPL Horizons System (Solar System Dynamics, JPL/Caltech/NASA), API — <https://ssd.jpl.nasa.gov/api/horizons.api>.
  Sun and Earth azimuth/elevation seen from each site, precomputed at build time by `scripts/fetch_horizons.py`
  (request URLs per file in `data/SOURCES.json`).
- LRO Lunar Orbiter Laser Altimeter (LOLA) Gridded Data Records, data set `LRO-L-LOLA-4-GDR-V1.0`, PDS Geosciences Node —
  <https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img/>
  (`ldem_80s_80m.img`, `ldem_75s_240m.img` and their `.lbl` labels; south polar stereographic, height = DN × 0.5 m above 1737.4 km).
  Terrain horizon profiles for sites south of 75°S, computed at build time by `scripts/horizon.py` (`data/horizon/`).
- Lunar Polar Illumination, NASA GSFC Planetary Geology, Geophysics and Geochemistry Laboratory (PGDA), E. Mazarico —
  <https://pgda.gsfc.nasa.gov/products/69>; maps `AVGVISIB_75S_120M_201608.IMG` (average Sun visibility) and
  `AVGVISIB_75S_120M_201608_EARTH.IMG` (average Earth visibility) from the LOLA PDS extras
  <http://imbrium.mit.edu/EXTRAS/ILLUMINATION/IMG/>. Used only as an independent check of the terrain horizon (H9 b,
  `scripts/pgda.py`); only the pixels around each point are read. Method: Mazarico, E., Neumann, G. A., Smith, D. E., Zuber, M. T.,
  Torrence, M. H. (2011), Illumination conditions of the lunar polar regions using LOLA topography, Icarus 211, 1066–1081.

## Site coordinates (`config/sites.json`)

- NASA NSSDCA, "Lunar landing sites" — <https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_sites.html> (Apollo 11, 12, 14, 15, 16, 17; Lunar Module positions).
- Lunar Reconnaissance Orbiter Camera (LROC) team pages — <https://lroc.im-ldi.com/images/1321> (IM-1 nominal landing area),
  <https://lroc.im-ldi.com/featured_sites/im2/flip-book> (IM-2 Athena), <https://lroc.im-ldi.com/images/1314> (Chandrayaan-3),
  <https://lroc.im-ldi.com/images/1100> (Chang'e 4).

## Libraries and tools

| Name | Version | License | Use |
|---|---|---|---|
| Vite | 8.3.8 | MIT | build tool (not shipped to the browser) |
| Astronomy Engine (`astronomy-engine`, Don Cross) | 2.1.19 | MIT | Sun/Earth directions and the Moon's IAU rotation model for own coordinates, computed in the browser (`src/moonsky.js`); <https://github.com/cosinekitty/astronomy> |
| Node.js | 22 | MIT | build and tests |
| Python | 3 (standard library) | PSF | data scripts and tests |
| Claude Code (Anthropic) | — | — | SI tool; see SI-DISCLOSURE.md |

## Fonts and images

None yet. The page uses system fonts. No NASA logos, flags or mission insignia are used.
