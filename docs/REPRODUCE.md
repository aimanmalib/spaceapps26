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
| 2D map | `scripts/map2d.py` | `data/map/` | LOLA DEMs |
| Skylines one kilometre away | `scripts/shifts.py` | `data/shift/` | LOLA DEMs |
| Whole-year shares there | `scripts/shift_year.mjs` | `data/shift-year/` | the files above |
| Angles vs JPL Horizons | `scripts/validate.py` | `data/validation.json` (`horizons`, `engine`) | JPL Horizons API |
| Terrain vs NASA PGDA, listed points | `scripts/pgda.py` | `data/validation.json` (`pgda`) | NASA GSFC PGDA product 69 |
| Terrain vs NASA PGDA, random points | `scripts/pgda_sample.py` | `data/validation.json` (`pgda_sample`) | NASA GSFC PGDA product 69 |
| Build and unit tests | `scripts/gerbang-ujian.sh` | | |

Settings (seeds, number of points, grid sizes, disc radii) are in `config/`; the scripts read them and store none of their own.
