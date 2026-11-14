// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Item i: camera, projection, frame, painter's order and direction lines on synthetic grids (no project data locked).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { camera, project, frame, quads, rayEnd } from '../src/surface3d.js';

const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);

test('looking north: east is to the right, north is farther and higher on screen', () => {
  const cam = camera(0, 30);
  const east = project(5, 0, 0, cam);
  near(east.sx, 5); near(east.sy, 0);
  const north = project(0, 10, 0, cam);
  near(north.sx, 0);
  near(north.sy, 10 * Math.sin(Math.PI / 6));
  assert.ok(north.depth > project(0, -10, 0, cam).depth);
});

test('turning the view: looking east puts south on the right; height raises the point', () => {
  const cam = camera(90, 30);
  near(project(0, -4, 0, cam).sx, 4);
  near(project(0, 0, 2, cam).sy, 2 * Math.cos(Math.PI / 6));
  assert.ok(project(0, 0, 2, cam).depth < project(0, 0, 0, cam).depth); // higher = nearer to a viewer above
});

test('frame holds every corner of the square at any turn', () => {
  for (const look of [0, 15, 45, 130, 270]) {
    const cam = camera(look, 30);
    const f = frame(40, -1, 3, cam);
    for (const [x, y] of [[-40, -40], [40, -40], [40, 40], [-40, 40]]) {
      for (const z of [-1, 3]) {
        const p = project(x, y, z, cam);
        assert.ok(p.sx >= f.left - 1e-9 && p.sx <= f.right + 1e-9 && p.sy >= f.bottom - 1e-9 && p.sy <= f.top + 1e-9, `${look} ${x} ${y} ${z}`);
      }
    }
  }
});

function grid(n, f) {
  const h = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) h.push(f(r, c));
  return { cells: n, half_width_km: 2, height_m: h };
}

test('quads: count with stride (last row/column kept), far → near, cells without data left out', () => {
  const map = grid(5, () => 0);
  const cam = camera(0, 30);
  assert.equal(quads(map, 1, 1, cam).length, 16);
  assert.equal(quads(map, 2, 1, cam).length, 4);
  assert.equal(quads(map, 3, 1, cam).length, 4); // indices 0, 3, 4
  const qs = quads(map, 1, 1, cam);
  for (let k = 1; k < qs.length; k++) assert.ok(qs[k - 1].depth >= qs[k].depth);
  assert.equal(qs[0].i < 5, true); // looking north: the first (farthest) quad is on the north row (row 0)
  const holed = grid(5, (r, c) => (r === 2 && c === 2 ? null : 0));
  assert.equal(quads(holed, 1, 1, cam).length, 12);
});

test('quads: exaggeration scales screen height of a raised cell', () => {
  const map = grid(3, (r, c) => (r === 0 && c === 0 ? 1000 : 0));
  const cam = camera(0, 30);
  const top = (ex) => Math.max(...quads(map, 1, ex, cam).flatMap((q) => q.pts.map((p) => p.sy)));
  near(top(2) - top(1), 1 * Math.cos(Math.PI / 6));
});

test('rayEnd: azimuth from north toward east, elevation up; vertical part stretched', () => {
  const p = rayEnd(0, 0, 1, 90, 0, 10, 2);
  near(p.x, 10); near(p.y, 0, 1e-9); near(p.z, 1);
  const q = rayEnd(0, 0, 0, 0, 30, 10, 2);
  near(q.y, 10 * Math.cos(Math.PI / 6)); near(q.z, 2 * 10 * 0.5);
});

test('config: item i settings are present and sane', () => {
  const cfg = JSON.parse(readFileSync(new URL('../config/surface3d.json', import.meta.url)));
  for (const k of ['every_cells', 'tilt_deg', 'exaggeration', 'look_default_deg', 'look_step_deg', 'ray_km', 'canvas_width_px']) {
    assert.equal(typeof cfg[k], 'number', k);
  }
  assert.ok(cfg.tilt_deg > 0 && cfg.tilt_deg < 90);
  assert.ok(cfg.exaggeration >= 1);
  assert.equal(360 % cfg.look_step_deg, 0);
});
