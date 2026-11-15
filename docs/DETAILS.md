# Still in View: features, limitations, data and validation in full

The reference part of the [README](../README.md): every feature with the item of the challenge text it answers, each
limitation, the one-year table of every listed site, the data sources and the full validation tables. The numbers here
are checked against the files in `data/` by `npm test`, like those in the README.

## Features

Built during the event weekend (14–15 November 2026). Pages on the live site: Compare, Overview, Play, Teach, Validation, Data sources, About.

Built:

- Pick a landing site and a UTC date and time (2026-11-01 to the end of 2040); see the Sun and Earth relative to the horizon, whether solar power generation and
  direct-to-Earth communication are possible, and the elevation of each.
- Horizon first: every card opens with one short verdict (for example "Link to Earth, no sunlight") and a 360° strip of the
  horizon with the Sun and Earth on it; at the ten south polar sites the ground in the strip is the LRO LOLA skyline. The strip's vertical
  scale (±5°, ±10°, ±20°, ±45° or ±90°, written in its corner) is the smallest that holds that card's Sun and Earth.
- Terrain range at the ten south polar sites: under the two answers, each card says whether an answer changes somewhere inside the terrain
  range (the skylines of the nine points 80 m apart around the site, one LOLA pixel, with the observer at 0 m and at 2 m) and
  gives the one-year shares across it; the horizon strip draws the range as a band around the skyline. Measured, IM-2: the Sun's
  centre is above the skyline 43.8 % of the year's hours at the site and 40.0 % to 44.0 % across the range; Earth 80.1 % and
  74.7 % to 80.5 %. The Sun answer changes inside the range in 4.2 % of the hours and the Earth answer in 5.8 %
  (`data/band/`, `scripts/band.py`).
- Time remaining before sunset or Earthset (or until sunrise or Earthrise), the duration of sunlight and the Earth visibility window
  around the chosen time.
- Eighteen listed sites: ten known landing sites (all six Apollo landings, CLPS IM-1 and IM-2, Chandrayaan-3, Chang'e 4), the place
  where IM-1 Odysseus came to rest (80.13°S, 1.44°E, next to its nominal landing area), and seven future south polar targets. Each
  coordinate is copied from a cited source (NASA NSSDCA, LROC, the NASA Technical Reports Server, an LPSC abstract or a journal
  paper).
- Future south polar targets (challenge text: "future CLPS mission targets", "alternative sites in the same region"): seven places
  NASA names for later landings, each with its own LOLA skyline, map, 1 km shifts and terrain range. Six of them are Artemis III candidate landing regions
  from the nine NASA listed in October 2024 (Malapert Massif, Nobile Rim 1, Nobile Rim 2, Haworth, Mons Mouton Plateau and
  de Gerlache Rim 2; Peak near Cabeus B, Mons Mouton and Slater Plain are left out because no citable coordinate was found); the Shackleton connecting ridge is where NASA
  says Blue Origin's Blue Moon Mark 1, a CLPS flight, will attempt a landing. Each coordinate is one point that the cited
  source gives inside the area (Malapert Massif in whole degrees), not a chosen landing point. Measured over the year: at the
  Shackleton ridge point the Sun is at least partly in view 81.7 % of the hours; at the Malapert Massif point Earth's centre is
  above the skyline 34.3 % of the hours, 100.0 % one kilometre north and 0.0 % one kilometre south. Compare them
  with IM-2 at one time:
  <https://aimanmalib.github.io/spaceapps26/?s=im-2,2026-11-14T00:00&s=malapert-massif,2026-11-14T00:00&s=nobile-rim-1,2026-11-14T00:00&s=shackleton-ridge,2026-11-14T00:00>
- Up to four scenarios at once, as cards and in one side-by-side table.
- Try a comparison: a row of ready-made comparisons above the cards, each one a shareable link: "Launch slipped two weeks" (IM-2 on
  2026-11-17 against 2026-12-01: the sunlight is lost, Earth stays in view), "IM-1: planned vs where it landed", "Apollo 11 vs the
  south pole" and "Ridge: summer vs winter" (`config/presets.json`; the tests recompute each comparison's answers from the data).
- Mission check on every card: a GO / RISKY / NO-GO line in the card head for a stay of 7, 14 or 29.5 days from the chosen time,
  and under the answers the numbers behind it: the share of hours with the Sun, Earth and both above the horizon used, the longest
  night, the longest gap without Earth, and a geometry estimate in W/m² for a vertical panel that turns to the Sun against a flat
  one (1361 W/m² × geometry × the visible share of the Sun's disc; no panel efficiency). GO needs the Sun in at least 70 % and
  Earth in at least 50 % of the hours and no night longer than 72 hours; one failed check gives RISKY, two or more NO-GO. These
  limits are settings (`config/metrics.json`), not the requirements of any mission.
- Lunar eclipses at the site: when Earth passes in front of the Sun as seen from the site, the card says so. The rule is the same
  as for the horizon: no sunlight for solar power while the Sun's centre is behind Earth; the covered share is shown and lowers the
  power estimate. The timeline, the mission check, the next windows and the Overview calendar follow, and a ready-made comparison
  opens one case (IM-2 on 2027-08-17, 05:00 against 07:00 UTC: the Sun stays 6.3° above the LOLA skyline while Earth covers 54 % of
  it, centre included). Checked against NASA GSFC's list of lunar eclipses: from 2026-11-01 to 2031-01-01 the tables hold 142
  stretches of hours with part of the Sun behind Earth at the eighteen sites, and every one lies within 2 hours of one of the 10
  eclipses on NASA's list (`data/eclipses.json`, `scripts/eclipses.mjs`, ADR 0109).
- Battery for the longest night (mission check): an example load of 100 W × the longest night of the stay, in kWh (`config/metrics.json`).
- Ground stations (card details): the Moon's elevation at the card time from the three Deep Space Network complexes (Goldstone
  DSS 14, Madrid DSS 63, Canberra DSS 43; coordinates from the NASA/JPL DSN handbook 810-005, module 301) against an example limit
  of 10°, and when none sees the Moon, the first that will within 24 hours. At the time tested the three elevations agree with JPL
  Horizons within 0.001° (`config/dsn.json`, `tests/dsn.test.mjs`, ADR 0109).
- First-load motion: when Compare first opens, the first card's horizon strip plays one lunar day of that card's own table in
  5 seconds (the Sun along the skyline, Earth's small wobble) and stops on the chosen time. It plays once; only the two markers
  move; with reduced motion set in the browser it does not play (`config/view.json` `first_load_motion`, ADR 0112).
- Download CSV: at the foot of every card, and under the side-by-side table for all scenarios, the hourly rows behind the mission
  check as one file (UTC time, Sun and Earth azimuth and elevation, the horizon used at that azimuth, both answers, the source of
  the angles, and whether the Sun is behind Earth). The file is made in the browser; nothing is sent anywhere (`config/csv.json`,
  ADR 0110).
- Take the tour: five steps for a first visit (the decision and its badge, the horizon strip, the ready comparisons, the
  one-kilometre example, the Validation link). It opens only when its button is pressed (`config/tour.json`, ADR 0110).
- Dates to the end of 2040: the frozen JPL Horizons tables cover 2026-11-01 to 2027-11-01; later dates are computed in the browser
  on the same hourly grid, and each card says which source its angles come from (checked against JPL Horizons, below).
- Sequential comparison: buttons on every card step to the previous or next listed site (date kept) or move the time 1 day
  earlier or later (site kept). "If the date moves" lists the same two answers, with their margins from the horizon used, for the
  chosen time and the next 14 days at the same time of day, marks the dates where an answer differs and counts them. Measured
  example, IM-2 from 2026-11-14 00:00 UTC: solar power possible on 13 of 15 dates; direct-to-Earth on 15 of 15.
- Next windows (mission window finder): on every card, the next stretches in the data, from the chosen time on, when the Sun and
  Earth are both above the horizon used without a break for at least 1 day, 3 days, 7 days or 14 days (hourly table, centre of each
  disc; at most five listed), with start, end and length; a button sets the card to a window's start. One line gives the share of
  hours in the data when both are above it. Measured example, IM-2 (terrain horizon) from 2026-11-14 00:00 UTC: next window
  2026-11-15 07:00 to 2026-11-30 19:00 UTC (15 d 12 h); both above the horizon in 36.0 % of the hours.
- Shareable link: "Copy link" puts the cards in the web address (`?s=<site id>,<UTC time>`, one `s` per card; own coordinates
  `?s=custom,<lat>,<lon east>,<UTC time>`); opening it restores the cards, and values that cannot be read are skipped with a
  visible notice. "Set all to now (UTC)" moves every card to the current hour while it is inside the data (otherwise the button is
  off and says why). Above the side-by-side table, one plain sentence per scenario repeats the card's two answers.
- Play (educational game, challenge text: "an educational game"): `/play.html` (source `src/play.html`), six rounds from `config/game.json`. Each round
  shows one listed site and one UTC time; the player answers the two questions (Sun above the horizon used, Earth above it) and
  presses Check. The answers are not stored in the config: they are computed with the same tables, terrain skylines and judgement
  as the Compare page, with one sentence per answer giving the elevation, the horizon in that direction and the margin, the
  horizon picture and a link that opens the round in the tool. Score out of 12; no timer, account, storage or sound.
- Teach (page for teachers, SI suggestion chosen by the author): `/teach.html` (source `src/teach.html`), a 15-minute class
  activity in three steps from `config/teach.json` (the game; Apollo 11 and IM-2 at the same time; the one-kilometre example),
  each with one question and a link. The page holds no answers: they appear in the tool when a link is opened. Below the steps,
  the Moon and Earth rows quoted from the NASA fact sheets. Printing hides the navigation and shows each link as a full address.
- A timeline of one lunar day (29.5 Earth days) on every card: Sun and Earth elevation over time, bars for when each is in view,
  a slider to move through it and a Play button (hidden when the device asks for reduced motion). A switch shows the whole one-year
  table instead (hourly steps, 1 Nov 2026 to 1 Nov 2027), with the share of hours each one is at least partly above the horizon used;
  for the sites with a terrain skyline these are the same "this tool" numbers as in the NASA PGDA check below.
- Own coordinates: type any latitude and longitude on the Moon. Sun and Earth positions for these are computed in browser,
  validated against JPL Horizons (Astronomy Engine; differences below). South of 75°S an own point gets a terrain skyline, computed in the
  browser from the LRO LOLA south polar grids: the full 80 m grid within 20 km of the pole, block-averaged copies elsewhere
  (400 m south of 80°S, 960 m from 75°S to 80°S), loaded once when first needed (up to 6.9 MB). North of 75°S an own point
  uses the ideal sphere horizon. Checked against the 80 m skylines of the ten listed terrain sites over the year's 8,761 hours:
  both answers agree in 97.2 % to 99.9 % of the hours at 9 sites and in 93.4 % at the de Gerlache Rim 2 point, which the card
  names (`data/terrain/gate.json`, `scripts/terrain_gate.mjs`, ADR 0106).
- Local terrain horizon from LRO LOLA for the south polar sites inside the elevation grids used here (75°S to the pole: IM-1 at two points, IM-2 and the seven future targets);
  every other site uses the ideal sphere horizon and says so.
- Small shifts in location or date: each card can list the same two answers for the chosen time moved 6 hours and 1 day either way,
  and, at the ten terrain sites, for points 1 km north, east, south and west, each with its own LOLA terrain horizon.
  Measured example, IM-2 at 2026-11-14 00:00 UTC: Earth is 1.3° above the terrain horizon at the site, but 1.5° below it 1 km east
  and 2.6° below it 1 km south. On the ideal sphere, 1 km tilts the horizon by only 0.033°. The 80 m terrain grid does not
  resolve small craters such as the one where the IM-2 lander stopped. Over the whole year (8761 hourly steps, 2026-11-01 to
  2027-11-01), Earth's centre is above the skyline 80.1 % of the hours at the IM-2 site, 64.4 % 1 km east and 56.6 % 1 km south
  (Sun: 43.8 %, 35.1 %, 45.7 %); at IM-1, 100.0 % at the site and 83.2 % 1 km east (`data/shift-year/`, `scripts/shift_year.mjs`).
- Earth view, drawn to scale: right under the two answers at the terrain sites, a window of sky 26° wide toward Earth (or the
  Sun), with the same degrees across and up, the Earth disc 1.9° across, the LRO LOLA skyline and the smooth-Moon line (0°), and
  buttons for the site and the points 1 km north, east, south and west (same data as the small-shifts table).
- Whole disc or part of it: each Sun and Earth answer also says whether the whole disc, part of it, or none of it is above the
  horizon used (angular radius seen from the Moon: Sun 0.267°, Earth 0.95°, mean distances). The yes/no answer itself uses the
  centre of the disc, the same rule as in the validation below.
- Moon and Earth compared: each card can show the length of one day (29.53 days against 24 hours), how fast the Sun moves across
  the sky at the site and chosen time, surface air pressure and the distance to the horizon from 2 m up (2.64 km against 5.05 km),
  with day length, radius and pressure quoted from the NASA NSSDCA Moon and Earth fact sheets. It also gives how far Earth moves in
  the site's sky over the whole table. Measured, 2026-11-01 to 2027-11-01: at IM-2 Earth stays within a 16.15° range of azimuth and
  between −2.30° and +10.79° elevation; at Apollo 11 within 37.72° of azimuth and between +57.96° and +73.68°.
- A 2D map and a 3D surface of LRO LOLA heights, 80 × 80 km around each of the ten terrain sites, with the site and the Sun and
  Earth directions at the chosen time. The 3D surface can be turned to look in any direction; its heights are stretched 2 times.
- Map layers (challenge text: "how to represent steep slopes and deep craters that create extreme shadow conditions"): buttons on
  the 2D map switch between Heights, Slope (degrees, computed in the page from the same LOLA heights, cells 0.5 km apart) and
  Average sunlight (NASA PGDA): NASA's average solar illumination map of the south pole (share of hourly steps over 18.6 years
  when any part of the Sun was visible), read on the same cells by `scripts/map_sunlight.py`, not computed by this tool. At the
  centre cell it gives 47 % at IM-1 and at IM-2, the PGDA values of the validation below.
- Day by day at every site (Overview page): a calendar of all listed sites by UTC day. Each cell shows how that day's 24 hours
  split between the Sun and Earth both in view, the Sun only, Earth only and neither; pick a month, sort by power, communication or
  both, and open any day on Compare (`data/calendar.json`, `scripts/calendar.mjs`).
- From the lander: in the 3D block of the terrain sites, a view from the lander's own position on the curved Moon, heights not
  stretched, facing Earth or the Sun, with the LOLA skyline drawn over the ground and both discs at their true size.
- Optional Indonesian and Malay interface text (SI translations, not reviewed by a native speaker): add `?lang=id` or `?lang=ms`
  to any page address, or use the links in the page footer. English stays the default; the choice is not stored.

## What it does, and limitations

I chose all three audiences named in the challenge (mission planners, educators, the public) and all twelve items (a–l) that SI listed
from the challenge text (its "Your solution may include" list and its "Potential Considerations"). The site's About page lists what is built for each item and its limitations; the Data
sources page lists every frozen data file with the request it came from.

Limitations:

- Dates (d): 2026-11-01 to 2040-12-31 UTC. The frozen JPL Horizons tables cover 2026-11-01 00:00 to 2027-11-01 00:00, one row per
  hour, interpolated in between; later dates use the in-browser engine on the same hourly grid. Every one-year number (Overview,
  calendar, year shares, the NASA PGDA checks) covers that first year only.
- Mission check: geometry only. The W/m² estimate uses 1361 W/m² (NASA NSSDCA Moon Fact Sheet) with no panel efficiency, no
  temperature and no Sun-distance correction, and the GO limits are settings, not the requirements of any mission.
- Azimuth near the zenith: the page interpolates azimuth and elevation between hourly rows, so when the Sun or Earth passes
  within about a degree of the zenith the azimuth shown can be off by degrees for that hour. The direction on the sky differs far
  less and the yes/no answers are not affected; it can only happen near the Moon's equator, not at the south polar sites. A
  test of dates to 2040 on a branch that was not merged met one such case, and that branch stays out until the interpolation
  is done on vectors.
- Lunar eclipses: Earth's disc is taken at its mean size (radius 0.95°; it ranges from 0.90° to 1.03°), so the contact times can be
  minutes off; sunlight bent through Earth's atmosphere is not modelled; the timeline and the mission check use hourly rows, so an
  eclipse shorter than one row can be missed there (the card uses its own minute). The Overview calendar covers the frozen year,
  which holds penumbral eclipses only.
- Battery and ground stations: the battery line is an example load × the longest night, with no losses, heaters or reserve; the
  ground station line is geometry only (an example 10° limit; no antenna masks, schedules or link budget).
- From the lander: the 3D ground uses 0.5 km cells out to 40 km, so its own skyline can differ from the LOLA 80 m line that the
  answers use (by up to 0.73° at the place where IM-1 came to rest); the view draws that line and says which one is judged.
- Terrain horizon (j): only at the ten listed sites inside the LOLA south polar grids used here (75°S to the pole): IM-1 at two
  points, IM-2 and the seven future targets.
  Every other listed site uses the ideal sphere horizon.
- Own coordinates (b): north of 75°S, ideal sphere horizon only. South of 75°S the skyline comes from coarser copies of the
  LOLA grids (400 m; 960 m from 75°S to 80°S, a band with no listed site to check against), except within 20 km of the pole
  (full 80 m grid). On narrow ridges and crater rims the coarse grid lowers the ground: 93.4 % of hours agree at the
  de Gerlache Rim 2 point, and on the 400 m copy alone only 53.8 % at the Shackleton ridge point, which is why the full grid is
  kept near the pole. Own points have no map, no 1 km shifts and no terrain range.
- 2D map (h), 3D surface (i) and the 1 km location shifts (l): only at those ten sites. Other sites show the date shifts only.
- Future targets: each is one point inside a candidate or target area several kilometres across, as given by the cited page, not
  a chosen landing point; the answers there change within a kilometre (the cards show the 1 km shifts and the terrain range).
- 3D surface (i): the Sun and Earth lines are drawn on top of the ground; terrain does not hide them, and no shadows are drawn.
- Map layers (h): this tool does not compute shadows on the map. The average sunlight layer is NASA's long-term average over
  18.6 years, not the one-year period of the tables; slopes shorter than 0.5 km are smoothed out.
- Terrain values on ridges: at a ridge the share of time with the Sun in view depends on the observer's height and changes within
  about 100 m (Validation, below). The tool places the observer 2 m above the ground everywhere. The terrain range on the
  terrain cards (nine points 80 m apart, observer at 0 m and at 2 m) is a sensitivity range for the 80 m LOLA grid, not an error
  bar on the real ground.
- Yes/no means the centre of the Sun or Earth disc is above the horizon; each answer also says when only part of the disc is above
  it (radius from mean distances). The independent terrain check (Validation, below) counts any part of the disc.
- Power and communication answers are geometry only: whether the Sun or Earth is above the horizon. Solar panel orientation, power
  output, antennas, relay satellites and link budgets are not modelled.
- Interface language: English is the default and the reference. Indonesian and Malay (`?lang=id`, `?lang=ms`, links in the page
  footer) are SI translations, not reviewed by a native speaker. Technical terms, numbers and site names are not changed.

## One year at every listed site

The Overview page (`overview.html`) counts every listed site over the whole data table (2026-11-01 00:00 to 2027-11-01 00:00 UTC,
8761 hourly steps). An hour counts when any part of the disc is above the horizon used, the rule of the one-year caption on
Compare. Counted by `scripts/overview.mjs` into `data/overview.json`; the tests check it against the tables, the caption and `data/validation.json`.
Read off the table (the page writes the same three lines from the file):

- Most hours with the Sun in view: Shackleton connecting ridge (Blue Moon Mark 1 target ridge), 81.7 %.
- Most hours with both the Sun and Earth in view: Apollo 12 (Ocean of Storms), 49.6 %.
- Longest unbroken stretch with both in view: IM-2 Athena (Mons Mouton area), 15.8 days (2026-11-15 to 2026-11-30).

| Site | Sun in view, % of hours | Earth in view, % | Both, % | Longest unbroken stretch with both | Horizon used |
|---|---|---|---|---|---|
| Apollo 11 (Tranquility Base) | 48.8 | 100.0 | 48.8 | 14.9 days (2026-11-15 to 2026-11-29) | ideal sphere |
| Apollo 12 (Ocean of Storms) | 49.6 | 100.0 | 49.6 | 14.9 days (2026-11-18 to 2026-12-03) | ideal sphere |
| Apollo 14 (Fra Mauro) | 49.5 | 100.0 | 49.5 | 14.9 days (2026-11-18 to 2026-12-03) | ideal sphere |
| Apollo 15 (Hadley-Apennine) | 49.0 | 100.0 | 49.0 | 15.0 days (2027-03-15 to 2027-03-29) | ideal sphere |
| Apollo 16 (Descartes Highlands) | 48.8 | 100.0 | 48.8 | 14.9 days (2026-11-15 to 2026-11-30) | ideal sphere |
| Apollo 17 (Taurus-Littrow) | 48.7 | 100.0 | 48.7 | 14.9 days (2027-03-12 to 2027-03-27) | ideal sphere |
| IM-1 Odysseus, nominal landing area (near Malapert A) | 45.6 | 100.0 | 45.6 | 15.1 days (2026-11-17 to 2026-12-02) | LOLA terrain |
| IM-2 Athena (Mons Mouton area) | 45.7 | 93.2 | 42.7 | 15.8 days (2026-11-15 to 2026-11-30) | LOLA terrain |
| Chandrayaan-3 Vikram (ISRO) | 49.0 | 100.0 | 49.0 | 15.6 days (2026-11-13 to 2026-11-29) | ideal sphere |
| Chang'e 4 (CNSA), lunar far side | 51.2 | 0.0 | 0.0 | none | ideal sphere |
| IM-1 Odysseus, where it came to rest | 39.3 | 100.0 | 39.3 | 13.0 days (2026-11-18 to 2026-12-01) | LOLA terrain |
| Malapert Massif (NASA Artemis candidate region) | 43.1 | 38.9 | 13.7 | 6.0 days (2027-10-16 to 2027-10-22) | LOLA terrain |
| Nobile Rim 1 (NASA Artemis candidate region) | 42.2 | 63.7 | 27.2 | 13.9 days (2026-11-15 to 2026-11-29) | LOLA terrain |
| Shackleton connecting ridge (Blue Moon Mark 1 target ridge) | 81.7 | 50.3 | 44.5 | 14.2 days (2027-09-12 to 2027-09-26) | LOLA terrain |
| Haworth (Artemis III candidate region, representative point) | 33.2 | 27.9 | 8.9 | 8.0 days (2027-07-23 to 2027-07-31) | LOLA terrain |
| Mons Mouton Plateau (Artemis III candidate region, representative point) | 27.6 | 59.7 | 21.0 | 14.5 days (2026-11-15 to 2026-11-30) | LOLA terrain |
| Nobile Rim 2 (Artemis III candidate region, representative point) | 33.9 | 29.9 | 9.6 | 8.5 days (2027-02-09 to 2027-02-18) | LOLA terrain |
| de Gerlache Rim 2 (Artemis III candidate region, representative point) | 19.1 | 54.2 | 13.7 | 9.4 days (2026-12-15 to 2026-12-24) | LOLA terrain |

Sites with a terrain skyline and sites on the ideal sphere use different horizons, so their numbers are not like for like. Geometry only.

## Data

Sun and Earth positions come from the JPL Horizons System; terrain comes from LRO LOLA topography. All data is fetched by scripts in
`scripts/` at build time, frozen in `data/`, and listed with its source in `data/SOURCES.json`. Full citations: `REFERENCES.md`.

## Validation

At scale (ADR 0108): `scripts/validate.py --scale` draws 720 random site-and-minute pairs (40 at each of the 18 listed sites,
fixed seed, never on a table hour) from 2026-11-01 to 2030-12-31: 178 on the dates of the frozen tables, which the page reads,
and 542 on the later dates, which the browser computes. JPL Horizons is asked for the same minutes in 36 batched requests
(`data/validation-scale.json`; summary in `data/validation.json`, block `scale`; raw answers in `data/horizons-cache.json`).
Largest / average difference: Sun azimuth 0.0152° / 0.0018°, Sun elevation 0.0047° / 0.0014°, Earth azimuth 0.0151° / 0.0018°, Earth elevation 0.0047° / 0.0013°.
Over all angles: largest difference 0.0152°; same solar power answer 720 of 720, same Earth answer 720 of 720.
Frozen-table dates: largest 0.0050°; engine dates: largest 0.0152°. Measured on the sky (the angle between the
two directions), the largest difference is 0.0061° for the Sun and 0.0063° for Earth: the 0.0152° is a Sun azimuth
with the Sun 79.9° high, where azimuth turns fastest. Every Horizons check in this section together (the 90 pairs below,
the 30 engine pairs at unnamed points, the 60 later-year pairs and these 720): 900 different site-and-minute pairs (3600 reference angles),
same solar power answer 900 of 900, same Earth answer 900 of 900. This total is the number on the first screen; its largest difference,
0.1465°, is the Sun azimuth 0.56° from the zenith in the later-year check below. Measured as directions on the sky, the largest difference of all 900 pairs is 0.0063°; the first screen gives that number.

Do the angles the tool shows match JPL Horizons? `scripts/validate.py` draws 90 site-and-time pairs at random (fixed seed,
never on a table hour) and compares the angles shown by the page's own code with Horizons asked directly for the same site and minute.
Result (`data/validation.json`, also on the site's Validation page):

| Angle | Largest difference | Average difference |
|---|---|---|
| Sun azimuth | 0.0047° | 0.0018° |
| Sun elevation | 0.0049° | 0.0020° |
| Earth azimuth | 0.0047° | 0.0019° |
| Earth elevation | 0.0043° | 0.0020° |

Largest difference over all angles: 0.0049°. Same solar power answer: 90 of 90;
same Earth communication answer: 90 of 90. The largest difference is the Sun azimuth at Apollo 14 (2027-08-03 22:41 UT) with the Sun 86.3° below the horizon,
where the azimuth changes fastest between two table hours.

Own coordinates are computed in browser, validated against JPL Horizons: `scripts/validate.py --engine` runs the page's engine
(Astronomy Engine, same hourly grid and interpolation) at the 90 pairs above and at 30 new pairs on 6 unnamed check points
(near side, far side, both poles), 120 pairs in all:

| Angle | Largest difference | Average difference |
|---|---|---|
| Sun azimuth | 0.0226° | 0.0015° |
| Sun elevation | 0.0028° | 0.0011° |
| Earth azimuth | 0.0285° | 0.0023° |
| Earth elevation | 0.0028° | 0.0010° |

Largest difference over all angles (engine): 0.0285°. Same solar power answer: 120 of 120; same Earth communication answer: 120 of 120.
The largest difference is the Earth azimuth on the far side (0°N 180°E, 2027-09-26 08:16 UT) with the Earth 88.4° below the
horizon, where azimuth is nearly undefined.

Dates after the frozen tables: `scripts/validate_years.py` compares the in-browser engine with JPL Horizons at 60 random
site-and-minute pairs at the listed sites in 2028 to 2040 (fixed seed, never on a table hour; `data/validation-years.json`): largest
difference 0.1465°, average 0.0022°, same solar power answer 60 of 60, same Earth communication answer
60 of 60. On the sky (great circle between the two directions) the largest difference is 0.0047° for the Sun and 0.0035° for Earth.
The largest azimuth difference is at Apollo 11 on 2028-02-08 14:14 UT, with the Sun 0.56° from the zenith, where the azimuth turns
about a hundred times faster than the direction: 0.0015° on the sky becomes 0.1465° in azimuth. Between hourly rows the page joins
the directions (unit vectors), not the azimuth and elevation (ADR 0113); before that, the same pair was 5.4775° in azimuth and
0.056° on the sky. The rule in `config/years.json` judges directions on the sky, not azimuth (the author's decision, ADR 0113):
every Sun and Earth direction within 0.05° of Horizons on a great circle, and every yes/no answer the same. It is met, so the cards
say that the engine is validated against JPL Horizons for the dates after the precomputed tables, to the end of 2040.

Is the terrain horizon right? `scripts/pgda.py` compares it with an independent NASA product, the average Sun and Earth visibility
maps of the lunar south pole (E. Mazarico, NASA GSFC PGDA, LOLA grid 120 m per pixel), at 11 points. A map value is the share
of hourly steps over 18.6 years when any part of the disc was visible; the tool's value in this first table is the share of hours
in its own one-year table (2026-11-01 to 2027-11-01) when any part of the disc is above its terrain skyline. The second table
repeats the check over the same 18.6 years.

| Point | Sun visible, this tool | Sun visible, PGDA | Earth visible, this tool | Earth visible, PGDA |
|---|---|---|---|---|
| IM-1, nominal landing area | 45.6 % | 46.7 % | 100.0 % | 100.0 % |
| IM-2 | 45.7 % | 46.8 % | 93.2 % | 93.1 % |
| IM-1, where it came to rest | 39.3 % | 35.6 % | 100.0 % | 100.0 % |
| Malapert Massif | 43.1 % | 42.9 % | 38.9 % | 41.2 % |
| Nobile Rim 1 | 42.2 % | 41.8 % | 63.7 % | 67.7 % |
| Shackleton connecting ridge | 81.7 % | 65.9 % | 50.3 % | 51.9 % |
| Haworth | 33.2 % | 32.2 % | 27.9 % | 30.2 % |
| Mons Mouton Plateau | 27.6 % | 29.1 % | 59.7 % | 61.2 % |
| Nobile Rim 2 | 33.9 % | 33.8 % | 29.9 % | 33.3 % |
| de Gerlache Rim 2 | 19.1 % | 20.5 % | 54.2 % | 56.9 % |
| Check point -89.45°, 222.69°E (not a landing site) | 85.7 % | 67.7 % | 53.3 % | 52.3 % |

Largest difference: Sun 18.0 percentage points, Earth 4.0 percentage points. At IM-1 (nominal landing area) and IM-2 the Sun
differs by 1.1 points and Earth by 0.1 or less; at the other 8 listed terrain sites the Sun differs by 0.1 to 15.8 points and
Earth by up to 4.0. The 18.0 points are at the check point 0.55° from the pole, on a ridge where the PGDA Sun value
itself ranges from 51.0 % to 84.7 % within the 3 × 3 pixels around it. It is reported as measured.

Over the same 18.6 years (`scripts/pgda_period.py`: the same skylines over 163048 hourly steps from 2009-07-13, with Sun and Earth
angles from the in-browser engine; the PGDA label gives the length of its simulation but not its dates):

| Point | Sun visible, this tool, 18.6 years | Sun visible, PGDA | Earth visible, this tool, 18.6 years | Earth visible, PGDA | Sun, lowest to highest calendar year |
|---|---|---|---|---|---|
| IM-1, nominal landing area | 46.6 % | 46.7 % | 100.0 % | 100.0 % | 45.0 % to 48.1 % |
| IM-2 | 46.9 % | 46.8 % | 93.2 % | 93.1 % | 45.5 % to 48.7 % |
| IM-1, where it came to rest | 40.2 % | 35.6 % | 100.0 % | 100.0 % | 38.8 % to 41.8 % |
| Malapert Massif | 41.5 % | 42.9 % | 40.5 % | 41.2 % | 39.7 % to 43.1 % |
| Nobile Rim 1 | 43.5 % | 41.8 % | 65.6 % | 67.7 % | 41.9 % to 45.0 % |
| Shackleton connecting ridge | 81.5 % | 65.9 % | 53.1 % | 51.9 % | 79.0 % to 82.0 % |
| Haworth | 32.2 % | 32.2 % | 30.3 % | 30.2 % | 31.1 % to 33.8 % |
| Mons Mouton Plateau | 28.9 % | 29.1 % | 61.3 % | 61.2 % | 27.1 % to 30.7 % |
| Nobile Rim 2 | 34.6 % | 33.8 % | 33.0 % | 33.3 % | 33.4 % to 36.3 % |
| de Gerlache Rim 2 | 19.7 % | 20.5 % | 55.9 % | 56.9 % | 18.4 % to 21.2 % |
| Check point -89.45°, 222.69°E (not a landing site) | 85.3 % | 67.7 % | 55.4 % | 52.3 % | 82.3 % to 85.8 % |

At IM-1 (nominal landing area) and IM-2 the largest difference is 0.1 percentage points. At the other 8 listed terrain sites the
Sun differs by 0.0 to 15.6 points and Earth by 0.0 to 2.1: the largest is the Shackleton ridge point, a ridge like the
check point. At the check point the Sun still differs by 17.6 points
and Earth by 3.1, and each of the 18 full calendar years gives 82.3 % to 85.8 % for the Sun, so the length of the period does not
explain the difference. What moves the value there is detail smaller than one map pixel: with the observer on the ground (0 m) the
tool gives 57.2 % for the Sun, and at 2 m (the height the tool uses everywhere) 85.3 %; the PGDA value of 67.7 % lies between the
two. At the nine points 120 m apart around it (one PGDA pixel) the tool gives 58.7 % to 86.5 %. At 2 m the skyline there is set by
ground closer than 1 km in 473 of 720 directions.

The same check at 100 random points spread evenly over the area south of 80° S (fixed seed, `scripts/pgda_sample.py`; each point
has its own LOLA skyline, and its Sun and Earth angles come from the in-browser engine), against the PGDA pixel nearest each point:

| | Median difference | 90th percentile | Largest difference | Inside the PGDA range of the 3 × 3 pixels nearby |
|---|---|---|---|---|
| Sun visible | 0.9 | 2.4 | 10.7 | 61 of 100 |
| Earth visible | 1.1 | 5.6 | 21.8 | 64 of 100 |

Differences are in percentage points and are reported as measured. This sample uses the one-year table and has not been repeated
over 18.6 years. Every file
in `data/` can be rebuilt from the NASA sources with one command: [`docs/REPRODUCE.md`](REPRODUCE.md).

