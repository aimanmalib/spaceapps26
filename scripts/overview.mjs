// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// P4s: one-year overview of every site in config/sites.json, from the frozen hourly tables already in data/.
// For each site: share of the hourly rows with any part of the Sun disc, the Earth disc, and both, above the horizon
// used (LOLA terrain skyline where data/horizon/<site>.json exists, otherwise the ideal sphere), and the longest
// unbroken run of rows with both. Same rule and disc radius as the timeline's one-year caption (config/view.json).
// Output: data/overview.json. No download; numbers only counted from data/ephem + data/horizon.
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseUtc } from '../src/ephem.js';
import { relativeTable } from '../src/terrain.js';
import { overviewRow } from '../src/overview.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (rel) => JSON.parse(readFileSync(root + rel, 'utf8'));
const view = read('config/view.json');
const eph = read('config/ephemeris.json');
const radius = view.timeline.year.disc_radius_deg;
const round = (v) => Math.round(v * 1000) / 1000;

const sites = read('config/sites.json').sites.map((s) => {
  const table = read(`data/ephem/${s.id}.json`);
  const terrain = existsSync(`${root}data/horizon/${s.id}.json`);
  const rel = relativeTable(table, terrain ? read(`data/horizon/${s.id}.json`) : null);
  return { site: s.id, horizon: terrain ? 'terrain' : 'sphere', ...overviewRow(rel, radius, parseUtc(table.start.replace('Z', '')), round) };
});

const out = {
  generated_by: 'scripts/overview.mjs (Claude Code, Anthropic); inputs config/sites.json, data/ephem, data/horizon',
  period: { start: eph.start, stop: eph.stop, step_minutes: eph.step_minutes },
  rule: 'share of hourly rows with any part of the disc above the horizon used (as the one-year caption of the timeline and data/validation.json "pgda")',
  disc_radius_deg: radius,
  longest_both: 'longest run of consecutive hourly rows with both Sun and Earth counted; start/end = first and last row; *_open = the run touches the start or end of the table',
  sites,
};
writeFileSync(root + 'data/overview.json', JSON.stringify(out, null, 1) + '\n');
console.log(sites.map((s) => `${s.site} ${s.horizon} sun ${s.sun} earth ${s.earth} both ${s.both} run ${s.longest_both?.hours ?? '-'} ${s.longest_both?.start ?? ''}–${s.longest_both?.end ?? ''}`).join('\n'));
