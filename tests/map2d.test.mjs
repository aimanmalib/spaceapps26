// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Item h: overlay geometry and relief shading on synthetic grids (no project data locked).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { polar, edgePoint, skylinePoints, relief, pixels, parseColor, slopes, rampPixels } from '../src/map2d.js';

const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);

test('polar: azimuth from north toward east, y = north', () => {
  near(polar(0, 5).x, 0); near(polar(0, 5).y, 5);
  near(polar(90, 5).x, 5); near(polar(90, 5).y, 0);
  near(polar(180, 2).y, -2); near(polar(270, 2).x, -2);
});

test('edgePoint lands on the square edge in the right direction', () => {
  near(edgePoint(0, 40).y, 40); near(edgePoint(0, 40).x, 0);
  const p = edgePoint(45, 40);
  near(p.x, 40); near(p.y, 40);
  const q = edgePoint(200, 40);
  near(Math.max(Math.abs(q.x), Math.abs(q.y)), 40);
  assert.ok(q.x < 0 && q.y < 0);
});

test('skylinePoints keeps only points inside the map, every N degrees', () => {
  const profile = { azimuth_step_deg: 90, at_km: [10, 50, 5, 1] };
  const pts = skylinePoints(profile, 90, 40);
  assert.equal(pts.length, 3); // the 50 km point east is outside a 40 km half width
  near(pts[0].y, 10); near(pts[1].y, -5); near(pts[2].x, -1);
  assert.equal(skylinePoints(profile, 180, 40).length, 2);
});

function grid(n, f) {
  const h = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) h.push(f(r, c));
  const known = h.filter((v) => v !== null);
  return { cells: n, half_width_km: 1, height_m: h, min_m: Math.min(...known), max_m: Math.max(...known) };
}
const light = { azimuth_deg: 315, elevation_deg: 45 };

test('relief: flat ground = cos(zenith); slope facing the light is brighter than the one facing away', () => {
  const flat = relief(grid(5, () => 100), light);
  near(flat.shade[12], Math.cos(Math.PI / 4));
  // Height rises toward the east (column) → ground faces west; light from the northwest lights it more than flat.
  const westFacing = relief(grid(5, (r, c) => c * 100), light);
  const eastFacing = relief(grid(5, (r, c) => -c * 100), light);
  assert.ok(westFacing.shade[12] > flat.shade[12]);
  assert.ok(eastFacing.shade[12] < flat.shade[12]);
  // Height rises toward the south (row) → ground faces north; lit more than flat.
  assert.ok(relief(grid(5, (r) => r * 100), light).shade[12] > flat.shade[12]);
});

test('relief: level runs 0 at the lowest to 1 at the highest; no-data cells and their neighbours are null', () => {
  const g = grid(5, (r, c) => (r === 0 && c === 0 ? null : c * 10));
  const rel = relief(g, light);
  assert.equal(rel.level[0], null);
  assert.equal(rel.level[1], null); // neighbour of the gap
  near(rel.level[2 * 5 + 2], 0.5);
  near(rel.level[2 * 5 + 4], 1);
});

test('pixels: colour between low and high, darkened by shade, transparent without data', () => {
  const rel = { level: [0, 1, null], shade: [1, 0, null] };
  const px = pixels(rel, [0, 0, 0], [200, 100, 50], 0.5);
  assert.deepEqual([...px.slice(0, 4)], [0, 0, 0, 255]);
  assert.deepEqual([...px.slice(4, 8)], [100, 50, 25, 255]);
  assert.deepEqual([...px.slice(8, 12)], [0, 0, 0, 0]);
});

test('parseColor reads hex and rgb()', () => {
  assert.deepEqual(parseColor(' #16130f'), [22, 19, 15]);
  assert.deepEqual(parseColor('rgb(230, 220, 203)'), [230, 220, 203]);
});

test('slopes: degrees from the height gradient; flat = 0, 45° ramp = 45, missing neighbour = null', () => {
  const n = 3, half = 1; // cells 1 km apart
  const flat = { cells: n, half_width_km: half, height_m: new Array(9).fill(100) };
  assert.ok(slopes(flat).every((v) => v === 0));
  const ramp = { cells: n, half_width_km: half, height_m: [0, 1000, 2000, 0, 1000, 2000, 0, 1000, 2000] }; // rises 1 km per km east
  near(slopes(ramp)[4], 45, 1e-9);
  const hole = { ...flat, height_m: [100, 100, 100, 100, 100, null, 100, 100, 100] };
  assert.equal(slopes(hole)[4], null);
  assert.equal(slopes(hole)[5], null);
});

test('rampPixels: clamps to the range, interpolates between even stops, null = transparent', () => {
  const stops = [[0, 0, 0], [100, 100, 100], [200, 0, 0]];
  const px = rampPixels([0, 25, 50, 100, 150, -5, null], 0, 100, stops);
  assert.deepEqual([...px.slice(0, 4)], [0, 0, 0, 255]);
  assert.deepEqual([...px.slice(4, 8)], [50, 50, 50, 255]);
  assert.deepEqual([...px.slice(8, 12)], [100, 100, 100, 255]);
  assert.deepEqual([...px.slice(12, 16)], [200, 0, 0, 255]);
  assert.deepEqual([...px.slice(16, 20)], [200, 0, 0, 255]); // above max = end colour
  assert.deepEqual([...px.slice(20, 24)], [0, 0, 0, 255]); // below min = first colour
  assert.deepEqual([...px.slice(24, 28)], [0, 0, 0, 0]);
});
