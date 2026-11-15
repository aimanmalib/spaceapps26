// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Helper for scripts/band.py: for each skyline variant of one site, the share of the site's one-year Horizons table
// with the centre of the Sun/Earth disc above the skyline (the cards' yes/no rule, src/disc.js) and with any part of
// it above (the one-year rule, src/terrain.js). The page's own code does the counting.
// Also the share of hours in which the yes/no answer changes inside the range (src/band.js, lowest against highest skyline).
// stdin: {table, azimuth_step_deg, threshold_deg, radius:{sun,earth}, lo:[...], hi:[...], profiles:[[elev...]]};
// stdout: {hours, changes:{sun,earth}, rows:[{centre:{sun,earth}, disc:{sun,earth}}]}.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { visibleShare } from '../src/terrain.js';
import { centreShare } from '../src/disc.js';
import { bandJudge } from '../src/band.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const job = JSON.parse(readFileSync(0, 'utf8'));
const table = JSON.parse(readFileSync(root + job.table, 'utf8'));
const round = (v) => Math.round(v * 1000) / 1000;
const rows = job.profiles.map((elev) => {
  const profile = { elev, azimuth_step_deg: job.azimuth_step_deg };
  return {
    centre: { sun: round(centreShare(table, profile, 'sun', job.threshold_deg)), earth: round(centreShare(table, profile, 'earth', job.threshold_deg)) },
    disc: { sun: round(visibleShare(table, profile, 'sun', job.radius.sun)), earth: round(visibleShare(table, profile, 'earth', job.radius.earth)) },
  };
});
const band = { lo: job.lo, hi: job.hi, azimuth_step_deg: job.azimuth_step_deg };
const n = table.sun.el.length;
const count = { sun: 0, earth: 0 };
for (let k = 0; k < n; k += 1) {
  const j = bandJudge({ sun: { az: table.sun.az[k], el: table.sun.el[k] }, earth: { az: table.earth.az[k], el: table.earth.el[k] } }, band, job.threshold_deg);
  if (j.sun.flip) count.sun += 1;
  if (j.earth.flip) count.earth += 1;
}
process.stdout.write(JSON.stringify({ hours: n, changes: { sun: round(count.sun / n), earth: round(count.earth / n) }, rows }));
