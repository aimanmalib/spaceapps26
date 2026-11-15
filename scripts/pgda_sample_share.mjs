// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// P4q helper for scripts/pgda_sample.py: share of hourly rows over the one-year period of config/ephemeris.json with
// any part of the Sun/Earth disc above a terrain skyline, at points with no Horizons table. Sun/Earth angles come from
// the in-browser engine (src/moonsky.js, checked against Horizons on the Validation page); the share is the page's own
// rule (src/terrain.js). stdin: {radius:{sun,earth}, points:[{id, lat, lon_east, elev, azimuth_step_deg}]};
// stdout: [{id, sun, earth, hours}].
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { computeTable } from '../src/moonsky.js';
import { parseUtc } from '../src/ephem.js';
import { visibleShare } from '../src/terrain.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (rel) => JSON.parse(readFileSync(root + rel, 'utf8'));
const eph = read('config/ephemeris.json');
const custom = read('config/custom.json');
const job = JSON.parse(readFileSync(0, 'utf8'));
const period = { startMs: parseUtc(eph.start), endMs: parseUtc(eph.stop), stepMinutes: eph.step_minutes,
  radiusKm: custom.moon_radius_km, decimals: custom.decimals };
const out = job.points.map((p) => {
  const table = computeTable(p, period);
  const profile = { elev: p.elev, azimuth_step_deg: p.azimuth_step_deg };
  return { id: p.id, sun: visibleShare(table, profile, 'sun', job.radius.sun),
    earth: visibleShare(table, profile, 'earth', job.radius.earth), hours: table.sun.el.length };
});
process.stdout.write(JSON.stringify(out));
