// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// P4u: "Over the whole year" for item l (small shifts). For each site with a LOLA terrain skyline and its four points
// one kilometre away (data/shift/<site>.json), the share of the hourly rows in one year when the centre of the Sun and
// of Earth is above the skyline (the yes/no rule of the cards), plus the share with any part of the disc above it.
// Site: JPL Horizons table (data/ephem) + skyline (data/horizon). Nearby points: their own skyline (data/shift) and
// Sun/Earth angles from the in-browser engine (src/moonsky.js), as the page does; the effect of using the site's
// Horizons angles there instead is measured and stored. Output: data/shift-year/shift-year.json.
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { computeTable } from '../src/moonsky.js';
import { parseUtc } from '../src/ephem.js';
import { visibleShare } from '../src/terrain.js';
import { centreShare } from '../src/disc.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (rel) => JSON.parse(readFileSync(root + rel, 'utf8'));
const view = read('config/view.json');
const custom = read('config/custom.json');
const th = view.horizon_threshold_deg;
const radius = view.timeline.year.disc_radius_deg;
const round = (v) => Math.round(v * 1000) / 1000;

const shares = (table, profile) => ({
  centre: { sun: round(centreShare(table, profile, 'sun', th)), earth: round(centreShare(table, profile, 'earth', th)) },
  disc: { sun: round(visibleShare(table, profile, 'sun', radius.sun)), earth: round(visibleShare(table, profile, 'earth', radius.earth)) },
});

const sites = readdirSync(root + 'data/shift').filter((f) => f.endsWith('.json')).sort().map((f) => {
  const id = f.replace(/\.json$/, '');
  const table = read(`data/ephem/${id}.json`);
  const profile = read(`data/horizon/${id}.json`);
  const shift = read(`data/shift/${id}.json`);
  const startMs = parseUtc(table.start.replace('Z', ''));
  const n = table.sun.el.length;
  const endMs = startMs + (n - 1) * table.step_minutes * 60_000;
  let effect = 0;
  const points = shift.points.map((p) => {
    const prof = { elev: p.elev, azimuth_step_deg: shift.azimuth_step_deg };
    const own = computeTable(p, { startMs, endMs, stepMinutes: table.step_minutes, radiusKm: custom.moon_radius_km, decimals: custom.decimals });
    const s = shares(own, prof);
    const alt = shares(table, prof);
    for (const k of ['centre', 'disc']) for (const b of ['sun', 'earth']) effect = Math.max(effect, Math.abs(s[k][b] - alt[k][b]));
    return { dir: p.dir, lat: p.lat, lon_east: p.lon_east, ...s };
  });
  return { site: id, hours: n, ...shares(table, profile), points, site_angles_effect_max: round(effect) };
});

const eph = read('config/ephemeris.json');
const out = {
  generated_by: 'scripts/shift_year.mjs (Claude Code, Anthropic); inputs data/ephem, data/horizon, data/shift',
  period: { start: eph.start, stop: eph.stop, step_minutes: eph.step_minutes },
  offset_km: read('config/shifts.json').location_offset_km,
  rule_centre: `share of hourly rows with the centre of the disc more than ${th} deg above the skyline (the yes/no answer on the cards)`,
  rule_disc: 'share of hourly rows with any part of the disc above the skyline (the PGDA rule, as in data/validation.json "pgda")',
  disc_radius_deg: radius,
  angles: 'site: JPL Horizons table; nearby points: Astronomy Engine in the browser code (src/moonsky.js); site_angles_effect_max = largest change of any share if the site Horizons angles were used at the nearby points instead',
  sites,
};
mkdirSync(root + 'data/shift-year', { recursive: true });
writeFileSync(root + 'data/shift-year/shift-year.json', JSON.stringify(out, null, 1) + '\n');
process.stdout.write(JSON.stringify(sites.map((s) => ({ site: s.site, centre: s.centre, disc: s.disc, effect: s.site_angles_effect_max, pts: s.points.map((p) => [p.dir, p.centre.sun, p.centre.earth]) }))) + '\n');
