# Lunar Landing Site Navigator

Entry for the **NASA Space Apps Challenge 2026** (Jakarta, virtual), challenge
**Lunar Landing Site Navigator**:
<https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/>

Team: Aiman Malib.

> "Your challenge is to create an intuitive tool or application that lets mission planners, educators, and the public compare landing
> sites and dates quickly, visualizing Sun and Earth positions relative to the horizon to assess power generation potential and
> direct-to-Earth communication windows."
> — challenge text, NASA Space Apps Challenge 2026

## Status

Work in progress during the event weekend (14–15 November 2026). This file grows as each part is built and checked.

Built so far:

- Pick a landing site and a UTC date and time; see the Sun and Earth relative to the horizon, whether solar power generation and
  direct-to-Earth communication are possible, and the elevation of each.
- Time remaining before sunset or Earthset (or until sunrise or Earthrise), the duration of sunlight and the Earth visibility window
  around the chosen time.
- Ten known landing sites (all six Apollo landings, CLPS IM-1 and IM-2, Chandrayaan-3, Chang'e 4), each coordinate copied from a
  cited NASA page (NSSDCA or LROC).
- Up to four scenarios at once, as cards and in one side-by-side table.
- A timeline of one lunar day (29.5 Earth days) on every card: Sun and Earth elevation over time, bars for when each is in view,
  a slider to move through it and a Play button (hidden when the device asks for reduced motion).
- Own coordinates: type any latitude and longitude on the Moon. Sun and Earth positions for these are computed in browser,
  validated against JPL Horizons (Astronomy Engine; differences below). They use the ideal sphere horizon only: local terrain is not
  computed for own coordinates, even inside the LRO LOLA grids.
- Local terrain horizon from LRO LOLA for the south polar sites inside the elevation grids used here (75°S to the pole: IM-1, IM-2);
  every other site uses the ideal sphere horizon and says so.

## What it will do

I chose all three audiences named in the challenge (mission planners, educators, the public) and all twelve items in the challenge's
"Your solution may include" list. They are built in order of technical dependency; anything not finished by the deadline is listed
under "Limitations" by item, not left half-built.

## Data

Sun and Earth positions come from the JPL Horizons System; terrain comes from LRO LOLA topography. All data is fetched by scripts in
`scripts/` at build time, frozen in `data/`, and listed with its source in `data/SOURCES.json`. Full citations: `REFERENCES.md`.

## Validation

Do the angles the tool shows match JPL Horizons? `scripts/validate.py` draws 50 site-and-time pairs at random (fixed seed,
never on a table hour) and compares the angles shown by the page's own code with Horizons asked directly for the same site and minute.
Result (`data/validation.json`, also on the site's Validation page):

| Angle | Largest difference | Average difference |
|---|---|---|
| Sun azimuth | 0.0439° | 0.0027° |
| Sun elevation | 0.0077° | 0.0021° |
| Earth azimuth | 0.0047° | 0.0019° |
| Earth elevation | 0.0042° | 0.0022° |

Largest difference over all angles: 0.0439°. Same solar power answer: 50 of 50;
same Earth communication answer: 50 of 50. The largest difference is the Sun azimuth at Apollo 14 (2027-08-03 22:41 UT) with the Sun 86.3° below the horizon,
where the azimuth changes fastest between two table hours.

Own coordinates are computed in browser, validated against JPL Horizons: `scripts/validate.py --engine` runs the page's engine
(Astronomy Engine, same hourly grid and interpolation) at the 50 pairs above and at 30 new pairs on 6 unnamed check points
(near side, far side, both poles), 80 pairs in all:

| Angle | Largest difference | Average difference |
|---|---|---|
| Sun azimuth | 0.0207° | 0.0020° |
| Sun elevation | 0.0070° | 0.0012° |
| Earth azimuth | 0.0446° | 0.0031° |
| Earth elevation | 0.0028° | 0.0010° |

Largest difference over all angles (engine): 0.0446°. Same solar power answer: 80 of 80; same Earth communication answer: 80 of 80.
The largest difference is the Earth azimuth on the far side (0°N 180°E, 2027-09-26 08:16 UT) with the Earth 88.4° below the
horizon, where azimuth is nearly undefined.

Is the terrain horizon right? `scripts/pgda.py` compares it with an independent NASA product, the average Sun and Earth visibility
maps of the lunar south pole (E. Mazarico, NASA GSFC PGDA, LOLA grid 120 m per pixel), at 3 points. A map value is the share
of hourly steps over 18.6 years when any part of the disc was visible; the tool's value is the share of hours in its own one-year
table (2026-11-01 to 2027-11-01) when any part of the disc is above its terrain skyline. The periods differ.

| Point | Sun visible, this tool | Sun visible, PGDA | Earth visible, this tool | Earth visible, PGDA |
|---|---|---|---|---|
| IM-1 | 45.6 % | 46.7 % | 100.0 % | 100.0 % |
| IM-2 | 45.7 % | 46.8 % | 93.2 % | 93.1 % |
| Check point -89.45°, 222.69°E (not a landing site) | 85.7 % | 67.7 % | 53.3 % | 52.3 % |

Largest difference: Sun 18.0 percentage points, Earth 1.0 percentage points. At the check point
near the pole the PGDA Sun value ranges from 51.0 % to 84.7 % within the 3 × 3 pixels around it.

## Tests

- `bash scripts/gerbang-ujian.sh` — build, JavaScript and Python unit tests.
- `python3 e2e/smoke.py <site URL>` — browser smoke test of a deployed copy (Chromium desktop 1280 px,
  Chromium 320 px, WebKit iPhone 13): the comparison and validation pages work, no console errors,
  no requests to other hosts, no horizontal overflow. Needs the Python `playwright` package and its browsers.

## AI disclosure (Super Intelligence / SI use)

SI was used in this project, and every use is declared. In short:

- **Decided by me (the author):** to take part, the Jakarta event, this challenge, the audiences and the items to build. I chose
  them from the list in NASA's challenge text.
- **Done by SI (Claude Code, Anthropic), on my instructions:** a feasibility comparison of the challenges, translation of the challenge
  text into Malay for me, build order, interface design, all code and data scripts, tests, slide layout, and translating and editing my
  Malay notes into English text.
- **Not used:** no SI-generated images, video or audio. Screenshots are real captures of the app.

Details, including "Who decided what": [`SI-DISCLOSURE.md`](SI-DISCLOSURE.md). Machine-readable form:
[`si-disclosure.json`](si-disclosure.json).

## License

Apache License 2.0 (`LICENSE`). Third-party data and libraries keep their own terms (`NOTICE`, `REFERENCES.md`).
