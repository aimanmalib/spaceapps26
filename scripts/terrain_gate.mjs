// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Gate for the terrain horizon of own coordinates (ADR 0106, gate set in ADR 0037): at every site in config/sites.json
// that has an 80 m skyline (data/horizon/<id>.json, scripts/horizon.py) and a frozen table (data/ephem/<id>.json), compute
// the skyline again with src/terrain-own.js on the coarse grids (data/terrain/, scripts/terrain_coarse.py) and count the
// hours in which both answers (Sun above the horizon, Earth above the horizon; centre of the disc, threshold of
// config/view.json) are the same with either skyline. The unnamed check point of config/pgda.json (80 m skyline and a one-year
// Horizons table in data/check/) is measured too, under check_points, and not counted in the site gate.
// Output: data/terrain/gate.json (config/terrain-own.json gate_file).
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { makeGrid, terrainProfile, siteGridM } from '../src/terrain-own.js';
import { horizonAt } from '../src/terrain.js';
import { isAbove } from '../src/ephem.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (rel) => JSON.parse(readFileSync(root + rel, 'utf8'));
const hcfg = read('config/horizon.json');
const tcfg = read('config/terrain-own.json');
const threshold = read('config/view.json').horizon_threshold_deg;

const grids = tcfg.grids.map((g) => {
  const buf = readFileSync(`${root}data/${g.file}`);
  return makeGrid(g, hcfg.moon_radius_m, new Int16Array(buf.buffer, buf.byteOffset, buf.byteLength / 2));
});
// Same measurement on the block-mean copies alone (no pole crop): the number that holds for a point outside the crop.
const coarseOnly = grids.filter((_, i) => tcfg.grids[i].factor > 1);

const pct = (n, d) => Math.round((10000 * n) / d) / 100;
const measured = (points, dir) => points.filter((s) => existsSync(`${root}data/horizon/${s.id}.json`) && existsSync(`${root}data/${dir}/${s.id}.json`)).map((s) => row(s, dir));

function row(s, dir) {
  const fine = read(`data/horizon/${s.id}.json`);
  const table = read(`data/${dir}/${s.id}.json`);
  const coarse = terrainProfile(hcfg, grids, s.lat, s.lon_east);
  const only = terrainProfile(hcfg, coarseOnly, s.lat, s.lon_east);
  const up = (b, k, p) => isAbove(table[b].el[k] - horizonAt(p, table[b].az[k]), threshold);
  const n = table.sun.el.length;
  let both = 0;
  let sun = 0;
  let earth = 0;
  let bothOnly = 0;
  for (let k = 0; k < n; k++) {
    const sOk = up('sun', k, fine) === up('sun', k, coarse);
    const eOk = up('earth', k, fine) === up('earth', k, coarse);
    sun += sOk;
    earth += eOk;
    both += sOk && eOk;
    bothOnly += up('sun', k, fine) === up('sun', k, only) && up('earth', k, fine) === up('earth', k, only);
  }
  const diff = fine.elev.map((v, i) => Math.abs(v - coarse.elev[i])).sort((a, b) => a - b);
  const q = (f) => Math.round(100 * diff[Math.min(diff.length - 1, Math.floor(f * diff.length))]) / 100;
  return {
    site: s.id, hours: n, site_grid_m: siteGridM(tcfg.grids, grids, s.lat, s.lon_east), both_same_pct: pct(both, n), sun_same_pct: pct(sun, n), earth_same_pct: pct(earth, n),
    skyline_diff_median_deg: q(0.5), skyline_diff_p95_deg: q(0.95), pass: pct(both, n) >= tcfg.gate_pct,
    coarse_only_both_same_pct: pct(bothOnly, n), coarse_only_pass: pct(bothOnly, n) >= tcfg.gate_pct,
  };
}

const rows = measured(read('config/sites.json').sites, 'ephem');
const checks = measured(read('config/pgda.json').extra_points, 'check');

const out = {
  generated_by: 'scripts/terrain_gate.mjs (Claude Code, Anthropic); inputs config/sites.json, config/terrain-own.json, data/terrain, data/horizon, data/ephem',
  gate_pct: tcfg.gate_pct,
  threshold_deg: threshold,
  lowest_both_same_pct: Math.min(...rows.map((r) => r.both_same_pct)),
  lowest_coarse_only_both_same_pct: Math.min(...rows.map((r) => r.coarse_only_both_same_pct)),
  sites: rows,
  check_points: checks,
};
writeFileSync(`${root}data/${tcfg.gate_file}`, JSON.stringify(out, null, 2) + '\n');
// Provenance (data/SOURCES.json): existing entries keep their place, this one is replaced or appended.
const sources = read('data/SOURCES.json');
const entry = {
  file: tcfg.gate_file,
  url: hcfg.dem_base_url + hcfg.dems[0].name + '.img',
  urls: [...hcfg.dems.map((d) => hcfg.dem_base_url + d.name + '.img'), 'https://ssd.jpl.nasa.gov/api/horizons.api'],
  retrieved_at: sources.files.find((f) => f.file === tcfg.grids[0].file)?.retrieved_at,
  license: 'Derived from data/terrain and data/horizon (LRO LOLA, NASA PDS Geosciences Node) and data/ephem (JPL Horizons System, NASA/JPL-Caltech); no new download',
  script: 'scripts/terrain_gate.mjs',
  generated_by: 'Claude Code (Anthropic) wrote this script; it only compares skylines and frozen tables already in data/',
};
const at = sources.files.findIndex((f) => f.file === entry.file);
if (at < 0) sources.files.push(entry);
else sources.files[at] = entry;
writeFileSync(`${root}data/SOURCES.json`, JSON.stringify(sources, null, 2) + '\n');
for (const r of [...rows, ...checks]) {
  console.log(`${r.site} (${r.site_grid_m} m at the site): both ${r.both_same_pct} % (sun ${r.sun_same_pct}, earth ${r.earth_same_pct}), skyline diff median ${r.skyline_diff_median_deg}° p95 ${r.skyline_diff_p95_deg}° ${r.pass ? 'PASS' : 'BELOW GATE'}; coarse copies alone ${r.coarse_only_both_same_pct} % ${r.coarse_only_pass ? 'PASS' : 'BELOW GATE'}`);
}
