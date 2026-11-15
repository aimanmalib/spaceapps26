# 0108: Validation at scale, and what a scientist can check

Status: accepted, 15 November 2026 (evening). Asked for by the author after reading competing READMEs (one reports thousands
of Horizons reference values over nine sites; others have "what a scientist can check", "how far to trust it", "what we refuse
to claim" sections and Lighthouse scores). Ours had 70 + 30 + 24 Horizons pairs (90 + 30 + 24 once the four Artemis III regions were added).

## Context

The Sun and Earth angles were checked against JPL Horizons three times: 70 random minutes on the frozen tables
(`data/validation.json`, `horizons`), 30 engine minutes at unnamed points (`engine`), and 24 engine minutes in 2028 to 2030
(`data/validation-years.json`). Each pair cost two one-minute Horizons requests with a 2 s pause, so ten times more pairs would
have meant about 2,000 requests and over an hour of API time.

## Decision

- New part `python3 scripts/validate.py --scale`, set in `config/validation.json` `scale`: `pairs_per_site` (40) random minutes
  at every listed site (18, so 720 pairs), fixed seed 20261117, never on a table hour, from 2026-11-01 00:00 to 2031-01-01 00:00
  UTC. "Shown" is what the page shows at that minute: the frozen table read by `src/ephem.js` up to the table end, the engine
  (`src/moonsky.js` through `scripts/engine_angles.mjs`) after it, the rule of `src/years.js` `sourceAt`. A pair in the one hour
  where the page mixes a table row and an engine row stops the run (change the seed); none fell there.
- Horizons is asked in batches: one request per site and body carries all 40 minutes (Horizons `TLIST`, calendar UT times,
  `TLIST_TYPE='CAL'`, `TIME_TYPE='UT'`, otherwise the same observer setup as `scripts/fetch_horizons.py`). Before adopting it, one
  `TLIST` request returned exactly the values already stored from the one-minute requests (92.142525° / 36.250672° at Apollo 11,
  2026-12-17 15:47 UT). 36 requests in all (18 sites × 2 bodies), at most one per second (`min_interval_seconds`), retried up to `retries` times after
  `retry_wait_seconds` × attempt. Code: `scripts/horizons_batch.py`.
- Every raw answer is kept in `data/horizons-cache.json`, keyed by a hash of its request URL, with the URL and retrieval time. A
  second run sends no request (measured: 0 sent, 36 read). When main added four Artemis III regions at the end of the site list, the draws at the first 14 sites stayed the same: the re-run sent 8 requests and read 28 from the cache. Deleting the file asks Horizons again.
- Results: pairs in `data/validation-scale.json`; summary in `data/validation.json` block `scale`: differences by angle, by source
  (frozen-table dates, engine dates), the angle on the sky between the two directions (azimuth differences grow near the zenith
  and nadir; this number does not), and every pair whose yes/no answer differs, listed and never dropped. `all_checks` adds the
  four checks together, each site-and-minute pair once (90 + 30 + 24 + 720 = 864 pairs, 3456 reference angles).
- Measured 2026-11-15: largest difference 0.0446° (a Sun azimuth with the Sun 84.2° high), 0.0054° on frozen-table dates,
  0.0446° on engine dates; on the sky at most 0.0061° (Sun) and 0.0063° (Earth); same solar power answer 720 of 720, same Earth
  answer 720 of 720. All checks together: 864 of 864 for both answers; no pair gives a different answer.
- Shown from the data, never typed: the Validation page opens with this check (`src/validation-scale.js`; the 720 pairs fold
  under "Show all"), and the first-screen line (`src/trust.js`) now reads `scale.all_checks` instead of the 70-pair block.
  Tests (`tests/validation-scale.test.mjs`, `tests/test_validation_scale.py`) re-run the page's own scripts on the stored pairs,
  re-derive every Horizons value from the cached raw answers, recompute the summaries and `all_checks` from the files, and check
  the page, the first-screen line and the README against them.
- README: "What a scientist can check" (claim → data file → one line to repeat it), a flow diagram (NASA sources → scripts →
  frozen data → browser → tests) and "What we do not claim", taken from the existing limitations without adding any.
- Lighthouse 12 scores of Compare and Overview (`scripts/lighthouse.sh`: local production build, default mobile settings,
  Playwright Chromium through `CHROME_PATH`, Lighthouse fetched by npx) are reported in the README as measured.

## Consequences

- `data/` grows by about 0.6 MB (pairs and raw answers); only the Validation page bundles the pairs. The first screen still loads
  `data/validation.json` only (the `scale` block holds no pairs).
- Run `--scale` after `scripts/validate.py` and `scripts/validate_years.py`: `all_checks` reads their files, and a test fails when
  it no longer matches them (`scripts/reproduce.sh` runs the steps in that order).
- A new listed site needs a new `--scale` run (the test requires `pairs_per_site` pairs at every listed site).

## Way back

Remove `scale` from `config/validation.json` and `data/validation.json`, delete `data/validation-scale.json` and
`data/horizons-cache.json` with their `data/SOURCES.json` entries, and the first-screen line falls back to the 70-pair block
(`v.scale?.all_checks ?? v.horizons`); remove the `validation-scale` import and call in `src/validation-main.js`, and
`tests/validation-scale.test.mjs`, `tests/test_validation_scale.py`, the README paragraphs that quote the block.
