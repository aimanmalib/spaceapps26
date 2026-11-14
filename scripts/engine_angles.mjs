// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Prints the Sun/Earth angles the page shows for own coordinates (item b) for each {lat, lon_east, time_utc} read as
// JSON on stdin: the same engine (src/moonsky.js), grid, rounding and interpolation (src/ephem.js) as the page,
// over the two grid rows around the time instead of the whole date range.
import { readFileSync } from 'node:fs';
import { parseUtc, sampleAt } from '../src/ephem.js';
import { computeTable } from '../src/moonsky.js';

const root = new URL('..', import.meta.url);
const read = (rel) => JSON.parse(readFileSync(new URL(rel, root), 'utf8'));
const eph = read('config/ephemeris.json');
const cfg = read('config/custom.json');
const step = eph.step_minutes * 60_000;
const start = parseUtc(eph.start);

const out = JSON.parse(readFileSync(0, 'utf8')).map((p) => {
  const ms = parseUtc(p.time_utc);
  const row = start + Math.floor((ms - start) / step) * step;
  const table = computeTable(p, { startMs: row, endMs: row + step, stepMinutes: eph.step_minutes, radiusKm: cfg.moon_radius_km, decimals: cfg.decimals });
  return sampleAt(table, ms);
});
process.stdout.write(JSON.stringify(out) + '\n');
