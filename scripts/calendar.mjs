// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Site-day calendar (ADR 0102): for every site in config/sites.json and every whole UTC day of the frozen one-year tables,
// the hours with any part of the Sun disc, the Earth disc, and both, above the horizon used (LOLA terrain skyline where
// data/horizon/<site>.json exists, otherwise the ideal sphere), and the hour a calendar cell opens on Compare.
// Same rule and disc radius as data/overview.json (config/view.json timeline.year). Output: data/calendar.json.
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { relativeTable } from '../src/terrain.js';
import { dailyCounts } from '../src/calendar.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (rel) => JSON.parse(readFileSync(root + rel, 'utf8'));
const view = read('config/view.json');
const radius = view.timeline.year.disc_radius_deg;
const cfg = read('config/calendar.json');

let firstDay = null;
const sites = read('config/sites.json').sites.map((s) => {
  const table = read(`data/ephem/${s.id}.json`);
  const day = table.start.slice(0, 10);
  if (!table.start.startsWith(`${day}T00:00`)) throw new Error(`${s.id}: table does not start at 00:00 UTC`);
  if (firstDay && firstDay !== day) throw new Error(`${s.id}: tables start on different days`);
  firstDay = day;
  const terrain = existsSync(`${root}data/horizon/${s.id}.json`);
  const rel = relativeTable(table, terrain ? read(`data/horizon/${s.id}.json`) : null);
  return { site: s.id, horizon: terrain ? 'terrain' : 'sphere', ...dailyCounts(rel, radius, cfg.pick_order, cfg.fallback_hour, view.horizon_threshold_deg) };
});

const out = {
  generated_by: 'scripts/calendar.mjs (Claude Code, Anthropic); inputs config/sites.json, config/calendar.json, data/ephem, data/horizon',
  rule: 'hours per UTC day with any part of the disc above the horizon used (as data/overview.json); whole days only',
  disc_radius_deg: radius,
  pick: `hour (UTC) a cell opens on Compare: middle of the day's longest stretch with the first of ${cfg.pick_order.join(', ')} counted that day, by disc centre where possible (Compare's answer), else ${cfg.fallback_hour}`,
  first_day: firstDay,
  days: sites[0].both.length,
  sites,
};
// One site per line keeps the file small and its diffs readable.
const body = out.sites.map((s) => '  ' + JSON.stringify(s)).join(',\n');
const head = JSON.stringify({ ...out, sites: undefined }, null, 1).replace(/\n}$/, '');
writeFileSync(root + 'data/calendar.json', `${head},\n "sites": [\n${body}\n ]\n}\n`);
console.log(`${out.days} days × ${sites.length} sites from ${firstDay}`);
