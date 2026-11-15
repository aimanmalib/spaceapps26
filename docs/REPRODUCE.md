# Reproduce the data and the checks

One command rebuilds every file in `data/` from public NASA sources and then runs the tests:

```bash
npm ci
bash scripts/reproduce.sh          # or: bash scripts/reproduce.sh --list   (prints the steps only)
```

- No account, key or login. Python 3 standard library and Node 22.
- Large download: the two LOLA south-polar DEMs (`ldem_80s_80m`, `ldem_75s_240m`, about 145 MB together) from the NASA PDS
  Geosciences Node, saved to the cache folder in `config/horizon.json`, outside the repository.
- The PGDA checks read only the few map pixels around each point with HTTP byte ranges; nothing large is stored.
- Each step runs at low priority (`nice -n 19`), one process. The random-point PGDA check takes about 3 to 6 seconds per point.
- Afterwards `git diff --stat data/` shows what changed. Retrieval dates always change. JPL Horizons may also return slightly
  different values if its ephemeris version has changed since the frozen tables were made (see `data/SOURCES.json`).

| Step | Script | Output | Source |
|---|---|---|---|
| Sun/Earth tables, one year, hourly | `scripts/fetch_horizons.py` | `data/ephem/`, `data/check/` | JPL Horizons API |
| DEM download | `scripts/horizon.py --download` | cache folder | LRO LOLA GDR, NASA PDS |
| Terrain skylines | `scripts/horizon.py` | `data/horizon/` | LOLA DEMs |
| Grids for own coordinates (80 m pole crop, 400 m and 960 m block means) | `scripts/terrain_coarse.py` | `data/terrain/*.bin` | LOLA DEMs |
| Their skylines vs the 80 m skylines (97 % gate, ADR 0106) | `scripts/terrain_gate.mjs` | `data/terrain/gate.json` | the files above, the Sun/Earth tables |
| 2D map | `scripts/map2d.py` | `data/map/` | LOLA DEMs |
| Skylines one kilometre away | `scripts/shifts.py` | `data/shift/` | LOLA DEMs |
| Terrain range (nine points 80 m apart, observer 0 m and 2 m) | `scripts/band.py` | `data/band/` | LOLA DEMs, the Sun/Earth tables |
| Whole-year shares there | `scripts/shift_year.mjs` | `data/shift-year/` | the files above |
| Site-by-day calendar | `scripts/calendar.mjs` | `data/calendar.json` | the files above |
| Engine vs JPL Horizons, 2028 to 2050 | `scripts/validate_years.py` | `data/validation-years.json` | JPL Horizons API |
| Angles vs JPL Horizons | `scripts/validate.py` | `data/validation.json` (`horizons`, `engine`) | JPL Horizons API |
| Angles vs JPL Horizons at scale: every listed site, 2026 to 2030, 28 batched requests (run after the two lines above) | `scripts/validate.py --scale` | `data/validation-scale.json`, `data/horizons-cache.json`, `data/validation.json` (`scale`) | JPL Horizons API |
| Terrain vs NASA PGDA, listed points | `scripts/pgda.py` | `data/validation.json` (`pgda`) | NASA GSFC PGDA product 69 |
| Terrain vs NASA PGDA over the same 18.6 years, ridge-point sensitivity | `scripts/pgda_period.py` | `data/validation.json` (`pgda_period`) | the `pgda` block, LOLA DEMs |
| Terrain vs NASA PGDA, random points | `scripts/pgda_sample.py` | `data/validation.json` (`pgda_sample`) | NASA GSFC PGDA product 69 |
| Build and unit tests | `scripts/gerbang-ujian.sh` | | |

Settings (seeds, number of points, grid sizes, disc radii) are in `config/`; the scripts read them and store none of their own.
