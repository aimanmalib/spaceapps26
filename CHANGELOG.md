# Changelog

All notable changes to this project are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
The project has no numbered releases: the site is one continuous build, and each page names the commit it was built from
(`version.json`).

## 2026-11-15, night: validation at scale (ADR 0108)

### Added
- Validation at scale: `python3 scripts/validate.py --scale` checks 560 random minutes, 40 at each of the 14 listed sites
  from 2026-11-01 to 2030-12-31 (frozen tables and in-browser engine), against JPL Horizons asked in 28 batched, cached,
  rate-limited requests: largest difference 0.0446° (0.0061° on the sky), same answers 560 of 560. Every Horizons check
  together: 684 pairs, same answers 684 of 684. Shown first on the Validation page; the first-screen line now quotes the total.
- README: "What a scientist can check" (claim, data file, one line to repeat it), a flow diagram, "What we do not claim", and
  Lighthouse scores from `scripts/lighthouse.sh`.

## 2026-11-15, evening: changes adopted from an SI red-team review

### Changed
- Validation: the NASA PGDA terrain check is repeated over the same 18.6 years as the NASA maps. At IM-1 and IM-2 the Sun and
  Earth then differ by 0.1 percentage points or less. At the ridge check point the Sun still differs by 17.6 points, so the
  earlier explanation ("the periods differ") is withdrawn; a sensitivity test shows the tool's value there runs from 57.2 %
  (observer on the ground) to 85.3 % (2 m up), with NASA's 67.7 % between.
- The validation line on the home page gives the same-period number at the two landing sites and says a ridge test point
  differs more.
- Compare: every card opens with one short verdict and a 360° strip of the horizon (the LOLA skyline at IM-1 and IM-2) with the
  Sun and Earth on it. The verdict sentences sit above the side-by-side table on every width; on phones the main buttons follow
  the cards. The intro sentence is shorter.

### Fixed
- Phones: a long site name in the site list no longer widens the page (seen in WebKit with the IM-1 name).

### Added
- Try a comparison: ready-made comparisons above the cards ("Launch slipped two weeks" and three more), and an opening sentence
  about rescheduling.
- Mission check on every card: a GO / RISKY / NO-GO line for a stay of 7, 14 or 29.5 days, the longest night, the longest gap
  without Earth and a panel geometry estimate in W/m².
- Day by day at every site: a calendar of every listed site by UTC day on the Overview page.
- From the lander: a view from the lander's position inside the 3D block.
- Dates to the end of 2030: the in-browser engine after the frozen tables, checked against JPL Horizons at 24 random pairs in
  2028 to 2030 (largest difference 0.0045°, same answers 24 of 24).
- Four more south polar sites, each with its own LOLA skyline, map, 1 km shifts and terrain range: three future targets (Malapert
  Massif and Nobile Rim 1, two of NASA's Artemis candidate landing regions, and the Shackleton connecting ridge, the target ridge
  of Blue Moon Mark 1) and the place where IM-1 Odysseus came to rest. Each coordinate is copied from a cited LROC or NASA page.
  The checks now cover all fourteen sites (70 random pairs against JPL Horizons, seven points against NASA PGDA).
- Terrain range on the terrain cards (first built for IM-1 and IM-2): the lowest and highest skyline over the nine points 80 m apart around the site, with
  the observer at 0 m and at 2 m. The card marks an answer that changes inside that range, gives the one-year shares across it,
  and the horizon strip draws it as a band (`data/band/`, `scripts/band.py`).

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
