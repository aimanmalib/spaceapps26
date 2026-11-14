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
