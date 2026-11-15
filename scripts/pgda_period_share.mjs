// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Helper for scripts/pgda_period.py: share of hourly steps over a long period (config/pgda.json "period") with any
// part of the Sun/Earth disc above a terrain skyline. Sun/Earth angles come from the in-browser engine (src/moonsky.js,
// checked against Horizons on the Validation page); the share is the page's own rule (src/terrain.js).
// stdin: {radius:{sun,earth}, start, years, points:[{id, lat, lon_east, elev, azimuth_step_deg, years?}]};
// stdout: [{id, sun, earth, hours, start, stop, years?: {sun:[min,max], earth:[min,max], count}}].
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { computeTable } from '../src/moonsky.js';
import { parseUtc } from '../src/ephem.js';
import { relativeTable, discShare } from '../src/terrain.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const custom = JSON.parse(readFileSync(root + 'config/custom.json', 'utf8'));
const job = JSON.parse(readFileSync(0, 'utf8'));
const HOUR = 3_600_000;
const startMs = parseUtc(job.start);
const hours = Math.round(job.years * 365.25 * 24);
const endMs = startMs + (hours - 1) * HOUR;
const iso = (ms) => new Date(ms).toISOString().slice(0, 16) + 'Z';

// Lowest and highest share over the full calendar years inside the period.
function yearRange(rel, body, radiusDeg, start) {
  const el = rel[body].el;
  const byYear = new Map();
  for (let k = 0; k < el.length; k += 1) {
    const y = new Date(start + k * HOUR).getUTCFullYear();
    const c = byYear.get(y) ?? [0, 0];
    c[0] += 1;
    if (el[k] + radiusDeg > 0) c[1] += 1;
    byYear.set(y, c);
  }
  const full = [...byYear.values()].filter(([n]) => n >= 8760).map(([n, up]) => up / n);
  return { min: Math.min(...full), max: Math.max(...full), count: full.length };
}

const tables = new Map(); // one engine table per position (several skylines can share it)
const tableAt = (p) => {
  const key = `${p.lat},${p.lon_east}`;
  if (!tables.has(key)) tables.set(key, computeTable(p, { startMs, endMs, stepMinutes: 60, radiusKm: custom.moon_radius_km, decimals: custom.decimals }));
  return tables.get(key);
};

const out = job.points.map((p) => {
  const rel = relativeTable(tableAt(p), { elev: p.elev, azimuth_step_deg: p.azimuth_step_deg });
  const row = { id: p.id, sun: discShare(rel, 'sun', job.radius.sun), earth: discShare(rel, 'earth', job.radius.earth), hours, start: iso(startMs), stop: iso(endMs) };
  if (p.years) {
    const s = yearRange(rel, 'sun', job.radius.sun, startMs);
    const e = yearRange(rel, 'earth', job.radius.earth, startMs);
    row.years = { sun: [s.min, s.max], earth: [e.min, e.max], count: s.count };
  }
  return row;
});
process.stdout.write(JSON.stringify(out));
