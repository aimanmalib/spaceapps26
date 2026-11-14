// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Prints the Sun/Earth angles the site would show for each {site, time_utc} read as JSON on stdin,
// using the same frozen tables and the same interpolation code as the page (src/ephem.js).
import { readFileSync } from 'node:fs';
import { parseUtc, sampleAt } from '../src/ephem.js';

const root = new URL('..', import.meta.url);
const pairs = JSON.parse(readFileSync(0, 'utf8'));
const tables = new Map();
const table = (id) => {
  if (!tables.has(id)) tables.set(id, JSON.parse(readFileSync(new URL(`data/ephem/${id}.json`, root), 'utf8')));
  return tables.get(id);
};
const out = pairs.map((p) => sampleAt(table(p.site), parseUtc(p.time_utc)));
process.stdout.write(JSON.stringify(out) + '\n');
