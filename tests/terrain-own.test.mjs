// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Terrain horizon for own coordinates (ADR 0106): the JavaScript rays equal scripts/horizon.py on the same grid, the coarse
// grids match their config, the gate record agrees with the labels, and points outside the area never load the grids.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { makeGrid, terrainProfile, steps, inTerrainArea, siteGridM, gateValues } from '../src/terrain-own.js';
import { makeTerrainOwn } from '../src/terrain-own-client.js';

const root = new URL('..', import.meta.url).pathname;
const read = (rel) => JSON.parse(readFileSync(root + rel, 'utf8'));
const tcfg = read('config/terrain-own.json');
const hcfg = read('config/horizon.json');
const R = 1737400;

// Synthetic polar grid: a 300 m high ring wall from 8 km to 12 km from the pole, a 50 m bump 3 km east of the pole.
const SIZE = 61;
const SCALE = 500;
function heightAt(row, col) {
  const off = (SIZE - 1) / 2;
  const d = Math.hypot(row - off, col - off) * SCALE;
  const bump = Math.hypot(row - off, col - off - 6) * SCALE < 600 ? 50 : 0;
  return d >= 8000 && d <= 12000 ? 300 : bump;
}
const dn = Array.from({ length: SIZE * SIZE }, (_, i) => Math.round(heightAt(Math.floor(i / SIZE), i % SIZE) / 0.5));
const spec = { name: 'synthetic', size: SIZE, scale_m: SCALE, offset_px: (SIZE - 1) / 2, max_lat: -80, dn_scale_m: 0.5 };
const rays = { moon_radius_m: R, azimuth_step_deg: 30, observer_height_m: 2, max_distance_km: 14, first_step_m: 40, step_fraction: 0.004 };

test('rays: same skyline as scripts/horizon.py on the same grid (pole and an off-pole point)', () => {
  const grid = makeGrid(spec, R, Int16Array.from(dn));
  const py = `
import array, json, sys
sys.path.insert(0, ${JSON.stringify(root + 'scripts')})
import horizon as H
a = json.loads(sys.stdin.read())
dem = H.Dem(a["spec"], ${R}, array.array("h", a["dn"]))
print(json.dumps([H.profile(a["cfg"], [dem], lat, lon)["elev"] for lat, lon in a["points"]]))`;
  const points = [[-90, 0], [-89.8, 45]];
  const want = JSON.parse(execFileSync('python3', ['-c', py], { input: JSON.stringify({ spec, dn, cfg: rays, points }) }).toString());
  points.forEach(([lat, lon], i) => {
    const got = terrainProfile(rays, [grid], lat, lon);
    assert.equal(got.elev.length, 12);
    got.elev.forEach((v, k) => assert.ok(Math.abs(v - want[i][k]) < 1e-9, `${lat},${lon} az ${k * 30}: ${v} vs ${want[i][k]}`));
  });
  // The wall at 8 km, 298 m above the observer, stands about 2.1° high from the pole.
  const pole = terrainProfile(rays, [grid], -90, 0);
  assert.ok(pole.elev.every((v) => v > 1.9 && v < 2.2), pole.elev.join(' '));
});

test('rays: a point outside every grid has no skyline; the step list is the one of horizon.py', () => {
  const grid = makeGrid(spec, R, Int16Array.from(dn));
  assert.equal(terrainProfile(rays, [grid], -80, 0), null);
  assert.equal(siteGridM([spec], [grid], -80, 0), null);
  assert.equal(siteGridM([spec], [grid], -90, 0), SCALE);
  const s = steps(rays);
  assert.equal(s[0], 40);
  assert.ok(s.at(-1) <= 14000 && s.at(-1) > 13900);
});

test('coarse grids: files match config/terrain-own.json and the projection of the source grids', () => {
  const src = Object.fromEntries(hcfg.dems.map((d) => [d.name, d]));
  for (const g of tcfg.grids) {
    const from = src[g.from];
    assert.equal(statSync(`${root}data/${g.file}`).size, g.size * g.size * 2, g.file);
    if (g.crop_px) {
      // Pole crop: unchanged pixels of the source, centred on the pole.
      assert.equal(g.factor, 1);
      assert.equal(g.size, g.crop_px);
      assert.equal(g.scale_m, from.scale_m);
      assert.equal(g.offset_px, from.offset_px - (from.size - g.crop_px) / 2);
      continue;
    }
    assert.equal(g.size * g.factor, from.size);
    assert.equal(g.scale_m, from.scale_m * g.factor);
    assert.equal(g.offset_px, (from.offset_px - (g.factor - 1) / 2) / g.factor);
    assert.equal(g.max_lat, from.max_lat);
  }
  // Finest first, so the rays read the pole crop wherever it covers them.
  const scales = tcfg.grids.map((g) => g.scale_m);
  assert.deepEqual(scales, [...scales].sort((a, b) => a - b));
  assert.equal(tcfg.lat_max, Math.max(...tcfg.grids.map((g) => g.max_lat)));
});

test('gate record: every listed site with an 80 m skyline is measured; labels take their numbers from it', () => {
  const gate = read(`data/${tcfg.gate_file}`);
  const sites = read('config/sites.json').sites;
  const withProfile = sites.filter((s) => {
    try {
      return statSync(`${root}data/horizon/${s.id}.json`) && statSync(`${root}data/ephem/${s.id}.json`);
    } catch {
      return false;
    }
  });
  assert.deepEqual(gate.sites.map((s) => s.site).sort(), withProfile.map((s) => s.id).sort());
  assert.equal(gate.gate_pct, tcfg.gate_pct);
  for (const s of gate.sites) assert.equal(s.pass, s.both_same_pct >= gate.gate_pct, s.site);
  for (const s of gate.sites) assert.equal(s.coarse_only_pass, s.coarse_only_both_same_pct >= gate.gate_pct, s.site);
  // As shipped (pole crop + coarse copies) every measured point passes; the labels name the coarse-copy numbers.
  for (const s of [...gate.sites, ...gate.check_points]) assert.ok(s.pass, `${s.site} ${s.both_same_pct}`);
  const v = gateValues(gate, tcfg, Object.fromEntries(sites.map((s) => [s.id, s.name])));
  assert.equal(v.total, gate.sites.length);
  assert.equal(v.pass, gate.sites.filter((s) => s.coarse_only_pass).length);
  assert.equal(v.lowPct, gate.lowest_coarse_only_both_same_pct);
  assert.equal(v.pole, 80);
  assert.equal(v.poleKm, 20);
  assert.equal(v.fine, 400);
  assert.equal(v.coarse, 960);
  assert.equal(v.terrainLat, '75');
  assert.ok(!v.lowSite.includes('('));
  // ADR 0037's IM-1 number at 400 m is reproduced by the same method on the stored grids.
  assert.equal(gate.sites.find((s) => s.site === 'im-1').both_same_pct, 97.24);
});

test('client: points north of the limit resolve to null without starting the worker', async () => {
  let started = 0;
  const own = makeTerrainOwn(tcfg, hcfg, () => (started++, { postMessage() {} }), 'https://example.test/app/');
  assert.equal(inTerrainArea(-74.9, tcfg), false);
  assert.equal(inTerrainArea(-75, tcfg), true);
  assert.equal(await own.profile({ lat: 10, lon_east: 20 }), null);
  assert.equal(own.inArea({ lat: -74.99 }), false);
  assert.equal(started, 0);
  own.profile({ lat: -85, lon_east: 30 });
  own.profile({ lat: -85, lon_east: 30 });
  own.profile({ lat: -86, lon_east: 30 });
  assert.equal(started, 1);
  assert.equal(own.ready(), false);
});

test('i18n: the terrain label says coarse grid, 80 m profiles and ADR 0037 in every language file', () => {
  for (const lang of ['en', 'id', 'ms']) {
    const d = read(`i18n/${lang}.json`);
    for (const k of ['terrainown.horizon', 'terrainown.horizon_pole', 'terrainown.horizon_outer', 'terrainown.details', 'terrainown.loading', 'terrainown.failed']) assert.ok(d[k], `${lang} ${k}`);
    assert.ok(d['terrainown.horizon'].includes('ADR 0037') && d['terrainown.horizon'].includes('80 m') && d['terrainown.horizon'].includes('{fine} m'), lang);
  }
});
