# 0042: Future south polar targets and the place where IM-1 came to rest

Status: accepted, 15 November 2026 (evening). Adopted by the author from an SI red-team review of the entry.

## Context

The challenge text asks for "future CLPS mission targets" and for comparing "alternative sites in the same region". The tool had
two south polar sites with terrain, both past missions, and its IM-1 entry was the nominal landing area, about 3 km from where the
lander came to rest. The site list rule stays: every coordinate is copied from a cited NASA page.

## Decision

- Four sites are added to `config/sites.json`, all inside the 80 m LOLA grid, so each gets a skyline, map, 1 km shifts, terrain
  range, a JPL Horizons table and a row in the Overview and in both PGDA checks (the scripts already work per listed site):
  - IM-1 Odysseus, where it came to rest: 80.13°S, 1.44°E (LROC image 1360; NASA and NSSDCA give the same numbers). Group CLPS,
    next to the nominal landing area, which stays.
  - Malapert Massif: 86°S, 0°E, "the heart of the Artemis 3 landing region" (LROC image 1294, whole degrees).
  - Nobile Rim 1: Lat -85.3630°, Lon 32.315156°, a point placed in that region in a NASA Ames study (NTRS 20250009664, Figure 1).
    Its figure labels the elevation 5,824 m; the LOLA 80 m grid gives 6,223 m at that coordinate. The coordinate is used as
    printed and the difference is recorded here.
  - Shackleton connecting ridge: 89.684°S, 196.739°E, where the ridge meets the rim of Shackleton (LROC image 1247). NASA says
    Blue Origin's Blue Moon Mark 1 (a CLPS flight) "will attempt a landing on the Shackleton Connecting Ridge".
  Malapert Massif and Nobile Rim 1 are on NASA's October 2024 list of nine candidate landing regions.
- New group `future` ("Future south polar targets"). Every text says that such an entry is one point inside a candidate or target
  area, not a chosen landing point. SI picked these three because a NASA or LROC page states a coordinate for them; other
  candidate regions and CLPS deliveries were left out because no such page with a coordinate was found.
- Measured consequences, reported as they are: at the Malapert Massif point Earth's centre is above the skyline 34.3 % of the
  year, 100.0 % one kilometre north and 0.0 % one kilometre south; the Shackleton ridge point has the Sun at least partly in view
  81.7 % of the year. Against NASA PGDA over the same 18.6 years the four new points differ by 1.4 to 15.6 percentage points
  (Sun), the ridge point most, so the home page line names IM-1 and IM-2 (0.1) and says that other terrain sites differ more.
- The random check against JPL Horizons now draws five pairs at each of the fourteen sites (70; the first 50 are the same pairs
  as before because new sites are added at the end of the list); `scripts/validate.py` keeps the blocks written by other scripts.
- Test fixed with it: near the pole one kilometre turns the local directions by degrees, so the coarse "site angles at nearby
  points" check applies only farther than 50 km from the pole; the page already computes each nearby point's own angles.
- Phones: the site select clips a long name instead of widening the page (WebKit).

## Way back

`git revert` of this commit, then `bash deploy/pasang.sh` and `bash deploy/pages.sh`: ten sites again, with the earlier numbers.
