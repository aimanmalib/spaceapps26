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
- Up to four scenarios at once, as cards and in one side-by-side table.
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

Do the angles the tool shows match JPL Horizons? `scripts/validate.py` draws 25 site-and-time pairs at random (fixed seed,
never on a table hour) and compares the angles shown by the page's own code with Horizons asked directly for the same site and minute.
Result (`data/validation.json`, also on the site's Validation page):

| Angle | Largest difference | Average difference |
|---|---|---|
| Sun azimuth | 0.0045° | 0.0022° |
| Sun elevation | 0.0038° | 0.0017° |
| Earth azimuth | 0.0044° | 0.0024° |
| Earth elevation | 0.0042° | 0.0022° |

Largest difference over all angles: 0.0045°. Same solar power answer: 25 of 25;
same Earth communication answer: 25 of 25.

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
