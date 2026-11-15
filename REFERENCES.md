# References

Every data set, library, tool and quoted text used in this project. Data provenance per file: `data/SOURCES.json`.
The site's Data sources page shows the same per-file list.

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
  Terrain horizon profiles for sites south of 75°S, computed at build time by `scripts/horizon.py` (`data/horizon/`);
  terrain horizons of points 1 km from those sites (item l) by `scripts/shifts.py` (`data/shift/`).
- Lunar Polar Illumination, NASA GSFC Planetary Geology, Geophysics and Geochemistry Laboratory (PGDA), E. Mazarico —
  <https://pgda.gsfc.nasa.gov/products/69>; maps `AVGVISIB_75S_120M_201608.IMG` (average Sun visibility) and
  `AVGVISIB_75S_120M_201608_EARTH.IMG` (average Earth visibility) from the LOLA PDS extras
  <http://imbrium.mit.edu/EXTRAS/ILLUMINATION/IMG/>. Used only as an independent check of the terrain horizon
  (`scripts/pgda.py`, and `scripts/pgda_period.py` for the same check over 18.6 years); only the pixels around each point are read.
  The map label `AVGVISIB_75S_120M_201608.LBL` gives the rule ("sunlit by any fraction of the solar disc") and the first date used
  as the start of the 18.6-year check. Method: Mazarico, E., Neumann, G. A., Smith, D. E., Zuber, M. T.,
  Torrence, M. H. (2011), Illumination conditions of the lunar polar regions using LOLA topography, Icarus 211, 1066–1081.

## Demo deck context

- NASA, "NASA Receives Some Data Before Intuitive Machines Ends Lunar Mission", news release, 7 March 2025 —
  <https://www.nasa.gov/news-release/nasa-receives-some-data-before-intuitive-machines-ends-lunar-mission/> (IM-2 landing distance
  from its intended site and end of mission; quoted in slide 2 of `demo/demo.pdf` as context only, not modelled by this tool).

## Moon and Earth compared (`config/moon-earth.json`, item k)

- NASA NSSDCA, "Moon Fact Sheet" — <https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html> (synodic period 29.53 days,
  volumetric mean radius 1737.4 km, surface pressure at night 3 × 10⁻¹⁵ bar; page last updated 11 January 2024, read 14 November 2026).
- NASA NSSDCA, "Earth Fact Sheet" — <https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html> (length of day 24.0000 h,
  volumetric mean radius 6371.0 km, surface pressure 1014 mb; read 14 November 2026).
- The sentence on the horizon without atmospheric refraction is quoted from the challenge text (Challenge, above).

## Site coordinates (`config/sites.json`)

- NASA NSSDCA, "Lunar landing sites" — <https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_sites.html> (Apollo 11, 12, 14, 15, 16, 17; Lunar Module positions).
- Lunar Reconnaissance Orbiter Camera (LROC) team pages — <https://lroc.im-ldi.com/images/1321> (IM-1 nominal landing area),
  <https://lroc.im-ldi.com/featured_sites/im2/flip-book> (IM-2 Athena), <https://lroc.im-ldi.com/images/1314> (Chandrayaan-3),
  <https://lroc.im-ldi.com/images/1100> (Chang'e 4), <https://lroc.im-ldi.com/images/1360> (IM-1 Odysseus, where it came to rest),
  <https://lroc.im-ldi.com/images/1294> (Malapert Massif: "the heart of the Artemis 3 landing region", 86°S, 0°E),
  <https://lroc.im-ldi.com/images/1247> (the Shackleton to de Gerlache ridge where it meets the rim of Shackleton, 89.684°S, 196.739°E).
- NASA Ames Research Center, P. Agrawal et al. (2025), "Terrain Obstruction and Visibility Analysis of Artemis Landing Regions Using
  Celestial Mapping System", NASA Technical Reports Server 20250009664 — <https://ntrs.nasa.gov/citations/20250009664>
  (Figure 1: a point placed in the Nobile Rim 1 region, Lat -85.3630°, Lon 32.315156°).
- NASA news release, "NASA Provides Update on Artemis III Moon Landing Regions" (October 2024) —
  <https://www.nasa.gov/news-release/nasa-provides-update-on-artemis-iii-moon-landing-regions/> (the nine candidate landing regions,
  among them Malapert Massif and Nobile Rim 1).
- NASA, "Moon Base Phases" — <https://www.nasa.gov/moonbase-phases/> ("Endurance will attempt a landing on the Shackleton Connecting
  Ridge": Blue Origin's Blue Moon Mark 1, a CLPS flight).

## Libraries and tools

| Name | Version | License | Use |
|---|---|---|---|
| Vite | 8.3.8 | MIT | build tool (not shipped to the browser) |
| Astronomy Engine (`astronomy-engine`, Don Cross) | 2.1.19 | MIT | Sun/Earth directions and the Moon's IAU rotation model for own coordinates, computed in the browser (`src/moonsky.js`); <https://github.com/cosinekitty/astronomy> |
| Node.js | 22 | MIT | build and tests |
| Python | 3 (standard library) | PSF | data scripts and tests |
| Playwright for Python (Microsoft) | 1.62.0 | Apache-2.0 | browser smoke test (`e2e/smoke.py`), screenshots (`scripts/capture_media.py`) and the demo PDF (`scripts/render_demo.py`); <https://playwright.dev/python/> |
| Pillow | 13.0.0 | MIT-CMU (HPND) | joins the timeline screenshots into `docs/media/timeline.gif` (`scripts/capture_media.py` only); <https://python-pillow.org/> |
| Claude Code (Anthropic) | — | — | SI tool; see SI-DISCLOSURE.md |

## Fonts, images and media

- Fonts: none loaded. The pages use the device's system font stack (`system-ui`, `-apple-system`, `Segoe UI`, `Roboto`, `sans-serif`).
- Link preview image `public/media/og.png`: a real 1200 x 630 screen capture of the home page of this tool (IM-2, 2026-11-14
  00:00 UTC), taken with Playwright. It shows the Apollo 8 photograph named below as the page does. Not generated by SI.
- Text: `CODE_OF_CONDUCT.md` is the Contributor Covenant, version 2.0 <https://www.contributor-covenant.org/version/2/0/code_of_conduct.html>,
  CC BY 4.0, with the contact line changed to this repository. The badge images in the README are served by GitHub and
  Shields.io <https://shields.io/> (README only; the site loads nothing from outside).
- Photograph: Apollo 8, AS08-14-2383 (24 December 1968), Earth over the horizon of the Moon. Credit: NASA. NASA Image and Video
  Library <https://images.nasa.gov/details/as08-14-2383>, file `as08-14-2383~medium.jpg` stored unchanged as
  `public/media/as08-14-2383.jpg` (listed on the Data sources page); cropped by CSS only on the home page (wide screens), the About page
  and slide 1. Use: NASA images and media guidelines <https://www.nasa.gov/nasa-brand-center/images-and-media/> ("generally are not
  subject to copyright in the United States"; NASA acknowledged as the source). Not generated by SI.
- Other images: none bundled. The sky panoramas, timeline, 2D map and 3D surface are drawn in the browser from the data above.
  Screenshots in `docs/media/` are real captures of this app made by `scripts/capture_media.py`; apart from the photograph above,
  the demo deck `demo/demo.pdf` uses only those captures.
- No NASA logos ("meatball"), agency or mission insignia, flags, or SI-generated images, video or audio are used.

## Standards used in tests

- Contrast ratio: W3C, Web Content Accessibility Guidelines (WCAG) 2.2, relative luminance and contrast ratio definitions —
  <https://www.w3.org/TR/WCAG22/#dfn-contrast-ratio> (`tests/contrast.test.mjs`, every text colour ≥ 4.5:1).
