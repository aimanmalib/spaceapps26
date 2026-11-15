// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// ADR 0103 "From the lander": curvature, camera, disc scale, near clipping, ground skyline vs profile (synthetic grids).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { toLocal, localGrid, dir, view, toCam, dirScreen, discPx, clipNear, groundPolys, heightAt, groundSkyline, skylineGap, wrap360 } from '../src/lander.js';

const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);
const R = 1737.4;

function grid(n, half, f) {
  const h = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) h.push(f(r, c));
  return { cells: n, half_width_km: half, height_m: h };
}

test('toLocal: east/north kept, the sphere drops away by about s²/2R', () => {
  const p = toLocal(10, 0, 0, 0, R);
  assert.ok(p.x > 9.99 && p.x < 10 && Math.abs(p.y) < 1e-12);
  near(p.z, -(10 * 10) / (2 * R), 1e-4);
  const n = toLocal(0, 3, 100, 2, R); // 100 m ground, eye 2 m: ground 98 m above the eye's level, minus the drop
  near(n.z, 0.098 - 9 / (2 * R), 1e-5);
  near(toLocal(0, 0, 5, 7, R).z, -0.002, 1e-12);
});

test('camera: the look direction lands at the centre; east is right when facing north; up is up', () => {
  const v = view(0, 0, 60, 600, 300);
  const [x, y] = dirScreen(0, 0, v);
  near(x, 300); near(y, 150);
  assert.ok(dirScreen(10, 0, v)[0] > 300);
  assert.ok(dirScreen(0, 5, v)[1] < 150);
  assert.equal(dirScreen(180, 0, v), null); // behind the eye
  const e = view(90, 20, 60, 600, 300); // facing east, looking up 20°
  const c = dirScreen(90, 20, e);
  near(c[0], 300); near(c[1], 150);
  assert.ok(dirScreen(180, 20, e)[0] > 300); // south is to the right when facing east
  near(toCam(dir(37, 12), view(37, 12, 50, 10, 10)).z, 1);
});

test('field of view: the edge of the view is half of hfov away; a disc is drawn at F·tan(radius)', () => {
  const v = view(0, 0, 60, 720, 405);
  near(dirScreen(30, 0, v)[0], 720, 1e-6);
  near(discPx(0.95, v), 360 / Math.tan(Math.PI / 6) * Math.tan((0.95 * Math.PI) / 180));
  assert.ok(discPx(0.95, v) / discPx(0.267, v) > 3.5); // Earth about 3.6 times wider than the Sun from the Moon
});

test('clipNear: a quad across the near plane keeps only the part in front', () => {
  const q = [{ x: 0, y: 0, z: -1 }, { x: 1, y: 0, z: -1 }, { x: 1, y: 0, z: 1 }, { x: 0, y: 0, z: 1 }];
  const c = clipNear(q, 0.5);
  assert.equal(c.length, 4);
  for (const p of c) assert.ok(p.z >= 0.5 - 1e-12);
  assert.equal(clipNear(q.map((p) => ({ ...p, z: -2 })), 0.5).length, 0);
});

test('groundPolys: far → near, nothing from behind the eye, holes left out', () => {
  const map = grid(21, 5, () => 0);
  const g = localGrid(map, 2, R, 1);
  const v = view(0, -5, 60, 600, 300);
  const ps = groundPolys(g, v, 0.0005);
  assert.ok(ps.length > 0);
  for (let k = 1; k < ps.length; k++) assert.ok(ps[k - 1].d >= ps[k].d);
  // Facing north: every visible cell is on the north half or touches the middle row (row index ≤ 10).
  for (const p of ps) assert.ok(Math.floor(p.i / 21) <= 10, `${p.i}`);
  const holed = grid(21, 5, (r, c) => (r === 5 && c === 10 ? null : 0));
  assert.ok(groundPolys(localGrid(holed, 2, R, 1), v, 0.0005).length < ps.length);
});

test('heightAt: bilinear inside, null outside', () => {
  const map = grid(3, 1, (r, c) => c * 100); // 0, 100, 200 m from west to east
  near(heightAt(map, 0, 0), 100);
  near(heightAt(map, 0.5, 0.3), 150);
  assert.equal(heightAt(map, 1.2, 0), null);
});

test('groundSkyline + skylineGap: a wall 300 m high 5 km east is seen at about atan(0.3/5) − drop', () => {
  const n = 41; // 0.5 km cells over ±10 km
  const map = grid(n, 10, (r, c) => (c === 30 ? 300 : 0)); // column 30 = 5 km east
  const sky = groundSkyline(map, 2, R, 1, 0.05);
  assert.equal(sky.length, 360);
  const want = (Math.atan2(0.298 - 25 / (2 * R), 5) * 180) / Math.PI;
  assert.ok(Math.abs(sky[90] - want) < 0.1, `${sky[90]} vs ${want}`);
  assert.ok(sky[270] < 0.01); // flat to the west: the ground falls below level
  const flat = { azimuth_step_deg: 1, elev: new Array(360).fill(0) };
  const gap = skylineGap(sky, 1, flat);
  assert.equal(gap.az, 90);
  near(gap.above, sky[90]);
  assert.ok(skylineGap(sky, 1, { azimuth_step_deg: 1, elev: new Array(360).fill(10) }).above < 0);
});

test('wrap360', () => {
  near(wrap360(-10), 350); near(wrap360(725), 5);
});

test('config: lander settings are present and sane', () => {
  const cfg = JSON.parse(readFileSync(new URL('../config/surface3d.json', import.meta.url))).lander;
  for (const k of ['hfov_deg', 'aspect', 'every_cells', 'near_km', 'moon_radius_km', 'drag_deg_per_px', 'aim_above_deg', 'key_step_deg', 'pitch_min_deg',
    'pitch_max_deg', 'gap_az_step_deg', 'gap_km_step', 'gap_note_deg', 'tick_step_deg']) assert.equal(typeof cfg[k], 'number', k);
  assert.ok(cfg.hfov_deg > 10 && cfg.hfov_deg < 120);
  assert.ok(cfg.pitch_min_deg < 0 && cfg.pitch_max_deg > 0);
  assert.ok(['sun', 'earth'].includes(cfg.start));
  const custom = JSON.parse(readFileSync(new URL('../config/custom.json', import.meta.url)));
  assert.equal(cfg.moon_radius_km, custom.moon_radius_km); // same sphere as the rest of the tool
});

test('i18n: every lander key in all three languages, placeholders kept', () => {
  const langs = ['en', 'id', 'ms'].map((l) => JSON.parse(readFileSync(new URL(`../i18n/${l}.json`, import.meta.url))));
  const keys = Object.keys(langs[0]).filter((k) => k.startsWith('lander.'));
  assert.ok(keys.length >= 15);
  const ph = (s) => (s.match(/\{\w+\}/g) || []).sort().join();
  for (const k of keys) for (const l of langs.slice(1)) assert.equal(ph(l[k] ?? ''), ph(langs[0][k]), k);
});
