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
same Earth communication answer: 25 of 25. Not checked here: local terrain (ideal sphere horizon).

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
