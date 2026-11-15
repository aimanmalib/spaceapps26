#!/usr/bin/env bash
# SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
# Rebuild every file in data/ from the public NASA sources, then run the tests. See docs/REPRODUCE.md.
# No account, key or login is needed. Large download: the two LOLA polar DEMs (about 145 MB) go to the cache folder
# named in config/horizon.json, outside the repository. Needs Python 3 (standard library) and Node 22 with `npm ci` done.
# Usage: bash scripts/reproduce.sh [--list]     (--list prints the steps without running them)
set -euo pipefail
cd "$(dirname "$0")/.."
unset GIT_DIR GIT_INDEX_FILE GIT_WORK_TREE
STEPS=(
  "python3 scripts/fetch_horizons.py"   # JPL Horizons one-year Sun/Earth tables (data/ephem, data/check)
  "python3 scripts/horizon.py --download"  # LOLA polar DEMs, about 145 MB, into the cache folder
  "python3 scripts/horizon.py"          # terrain skylines (data/horizon)
  "python3 scripts/terrain_coarse.py"   # LOLA grids for own coordinates: 80 m pole crop + 400 m / 960 m copies (data/terrain)
  "node scripts/terrain_gate.mjs"       # their skylines vs the 80 m skylines at every polar site (data/terrain/gate.json)
  "python3 scripts/map2d.py"            # 2D map tiles (data/map)
  "python3 scripts/shifts.py"           # skylines one kilometre away (data/shift)
  "node scripts/shift_year.mjs"         # whole-year shares at those points (data/shift-year)
  "python3 scripts/band.py"             # terrain range: lowest and highest skyline within 80 m, observer 0 m and 2 m (data/band)
  "node scripts/overview.mjs"           # one-year overview of every listed site (data/overview.json)
  "node scripts/calendar.mjs"           # site-by-day calendar of the same year (data/calendar.json)
  "python3 scripts/validate.py"         # tool vs JPL Horizons, listed sites and own coordinates (data/validation.json)
  "python3 scripts/validate_years.py"   # in-browser engine vs JPL Horizons, 2028 to 2030 (data/validation-years.json)
  "python3 scripts/pgda.py"             # terrain horizon vs NASA PGDA at the listed points
  "python3 scripts/pgda_period.py"      # the same over 18.6 years + ridge-point sensitivity (block pgda_period)
  "python3 scripts/pgda_sample.py"      # the same at random points (block pgda_sample)
  "bash scripts/gerbang-ujian.sh"       # build + unit tests
)
for s in "${STEPS[@]}"; do
  echo "== $s"
  if [ "${1:-}" != "--list" ]; then nice -n 19 $s; fi
done
echo "reproduce: done. 'git diff --stat data/' shows what changed (dates of retrieval always change)."
