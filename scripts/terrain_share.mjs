// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// H9(b) helper for scripts/pgda.py: share of table hours with the Sun/Earth disc above the terrain skyline,
// computed by the page's own code (src/terrain.js). stdin: [{id, table, horizon, radius:{sun,earth}}] (paths
// relative to the repo root); stdout: [{id, sun, earth, hours, start}].
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { visibleShare } from '../src/terrain.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (rel) => JSON.parse(readFileSync(root + rel, 'utf8'));
const jobs = JSON.parse(readFileSync(0, 'utf8'));
const out = jobs.map((j) => {
  const table = read(j.table);
  const profile = read(j.horizon);
  return {
    id: j.id,
    sun: visibleShare(table, profile, 'sun', j.radius.sun),
    earth: visibleShare(table, profile, 'earth', j.radius.earth),
    hours: table.sun.el.length,
    start: table.start,
    step_minutes: table.step_minutes,
  };
});
process.stdout.write(JSON.stringify(out));
