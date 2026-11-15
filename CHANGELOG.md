# Changelog

All notable changes to this project are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
The project has no numbered releases: the site is one continuous build, and each page names the commit it was built from
(`version.json`).

## 2026-11-15, the submitted build

### Added
- The view toward Earth (or the Sun) drawn to scale over the terrain skyline at IM-1 and IM-2, with buttons for the points
  1 km north, east, south and west, and a button that opens the one-kilometre example.
- Shares over the whole year for the 1 km points, and the labels whole disc, partly hidden and hidden on every answer.
- Overview page: one sortable table of all ten listed sites over the year.
- Next windows, sequential comparison ("If the date moves"), shareable links, a plain sentence per scenario, "Set all to now".
- Play (six rounds) and Teach (a 15-minute class activity).
- Slope and NASA's average sunlight layer on the 2D map.
- Terrain check against the NASA GSFC PGDA maps at 100 random points south of 80°S, and `docs/REPRODUCE.md`.
- One-year timeline; Indonesian and Malay interface text as optional translations.
- A copy of the site on GitHub Pages, page descriptions, a link preview image and a favicon.

### Changed
- The first screen gives the answers and the main buttons before the scenario cards.
- The project is named Still in View.

## 2026-11-14, first build

### Added
- Sun and Earth relative to the horizon for a landing site and a UTC time, from JPL Horizons tables frozen at build time.
- Side-by-side comparison of up to four scenarios, own coordinates, time left before sunset or Earthset.
- Terrain horizon from LRO LOLA heights at IM-1 and IM-2, a 2D map and a 3D surface.
- Small shifts in time and place, Moon and Earth compared, a one-lunar-day timeline.
- Validation against JPL Horizons and the NASA GSFC PGDA maps, shown on the Validation page.
- Seven-slide deck, `SI-DISCLOSURE.md`, `REFERENCES.md`.
