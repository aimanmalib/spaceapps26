// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Item b (own coordinates): input checks, the in-browser engine (src/moonsky.js) and its H9(a) record in data/validation.json.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseCoords, normLon } from '../src/custom.js';
import { computeTable, localFrame, skyAt } from '../src/moonsky.js';
import { parseUtc, sampleAt } from '../src/ephem.js';
import { makeT } from '../src/i18n.js';
import { engineHtml } from '../src/validation.js';

const root = new URL('../', import.meta.url);
const load = (rel) => JSON.parse(readFileSync(new URL(rel, root), 'utf8'));
// Fixture limits (not config/custom.json) so the checks do not move when the config does.
const LIMITS = { lat_min: -90, lat_max: 90, lon_min: -180, lon_max: 360 };

test('coordinates: decimal text, west as negative, out of range and junk rejected', () => {
  assert.deepEqual(parseCoords('-89.45', '222.69', LIMITS), { lat: -89.45, lon_east: 222.69 });
  assert.deepEqual(parseCoords(' 3 ', '−23.5', LIMITS), { lat: 3, lon_east: 336.5 });
  assert.deepEqual(parseCoords('0', '360', LIMITS), { lat: 0, lon_east: 0 });
  assert.deepEqual(parseCoords('90.1', '0', LIMITS), { error: 'lat' });
  assert.deepEqual(parseCoords('', '0', LIMITS), { error: 'lat' });
  assert.deepEqual(parseCoords('1e1', '0', LIMITS), { error: 'lat' });
  assert.deepEqual(parseCoords('10', '-181', LIMITS), { error: 'lon' });
  assert.deepEqual(parseCoords('10', 'abc', LIMITS), { error: 'lon' });
  assert.equal(normLon(-0.5), 359.5);
});

test('local frame: up, east and north are orthonormal; up at the pole is the rotation axis', () => {
  const axis = { ra: 17.8, dec: 66.5, spin: 120, north: (() => {
    const ra = 17.8 * 15 * Math.PI / 180, dec = 66.5 * Math.PI / 180;
    return { x: Math.cos(dec) * Math.cos(ra), y: Math.cos(dec) * Math.sin(ra), z: Math.sin(dec) };
  })() };
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  for (const [lat, lon] of [[0, 0], [-45, 270], [89, 10]]) {
    const f = localFrame(axis, lat, lon);
    for (const v of [f.up, f.east, f.north]) assert.ok(Math.abs(dot(v, v) - 1) < 1e-12);
    assert.ok(Math.abs(dot(f.up, f.east)) < 1e-12 && Math.abs(dot(f.up, f.north)) < 1e-12 && Math.abs(dot(f.east, f.north)) < 1e-12);
  }
  const pole = localFrame(axis, 90, 0).up;
  assert.ok(Math.abs(pole[0] - axis.north.x) < 1e-12 && Math.abs(pole[2] - axis.north.z) < 1e-12);
});

test('engine reproduces the measured check point (config/ephemeris.json, measured before the build)', () => {
  const c = load('config/ephemeris.json').check_points[0];
  const s = skyAt(c, parseUtc(c.start), 1737.4);
  assert.ok(Math.abs(s.sun.el - c.expect_first_row.sun_el) <= c.expect_first_row.tolerance_deg, s.sun.el);
  assert.ok(Math.abs(s.earth.el - c.expect_first_row.earth_el) <= c.expect_first_row.tolerance_deg, s.earth.el);
});

test('engine table has the frozen-table shape and grid', () => {
  const start = Date.UTC(2026, 10, 14);
  const tb = computeTable({ lat: 10, lon_east: 20 }, { startMs: start, endMs: start + 3 * 3_600_000, stepMinutes: 60, radiusKm: 1737.4, decimals: 3 });
  assert.equal(tb.start, '2026-11-14T00:00Z');
  assert.equal(tb.step_minutes, 60);
  for (const b of ['sun', 'earth']) for (const k of ['az', 'el']) assert.equal(tb[b][k].length, 4);
  assert.ok(sampleAt(tb, start + 90 * 60_000));
});

const data = load('data/validation.json');
const engine = data.engine;
const nd = load('config/validation.json').decimals_report;

test('engine H9(a) record: ≥ 20 pairs incl. unnamed points, summary follows from the pairs', () => {
  assert.ok(engine.pairs.length >= 20, engine.pairs.length);
  const points = load('config/validation.json').engine.points.map((p) => p.id);
  for (const id of points) assert.ok(engine.pairs.some((p) => p.site === id), id);
  const absAll = engine.pairs.flatMap((p) => ['sun', 'earth'].flatMap((b) => ['az', 'el'].map((k) => Math.abs(p.diff[b][k]))));
  assert.equal(engine.max_abs_deg, Math.max(...absAll));
  assert.equal(engine.same_answer.of, engine.pairs.length);
});

test('"shown" engine angles in the file equal what the engine gives now', () => {
  const eph = load('config/ephemeris.json');
  const cfg = load('config/custom.json');
  const step = eph.step_minutes * 60_000;
  const start = parseUtc(eph.start);
  const round = (v) => Math.round(v * 10 ** nd) / 10 ** nd;
  for (const p of engine.pairs.filter((_, i) => i % 7 === 0)) {
    const ms = parseUtc(p.time_utc);
    const row = start + Math.floor((ms - start) / step) * step;
    const s = sampleAt(computeTable(p, { startMs: row, endMs: row + step, stepMinutes: eph.step_minutes, radiusKm: cfg.moon_radius_km, decimals: cfg.decimals }), ms);
    // Python and JS round halves differently (−77.29675 → −77.2968 / −77.2967): allow one unit in the last place.
    for (const b of ['sun', 'earth']) for (const k of ['az', 'el']) assert.ok(Math.abs(round(s[b][k]) - p.shown[b][k]) <= 1.5 * 10 ** -nd, `${p.site} ${b}.${k}`);
  }
});

test('the Validation page shows the engine numbers from the file', () => {
  const t = makeT(load('i18n/en.json'));
  const html = engineHtml(t, engine, () => undefined, nd);
  assert.ok(html.includes(`${engine.max_abs_deg.toFixed(nd)}°`));
  assert.ok(html.includes(`${engine.same_answer.power} of ${engine.same_answer.of}`));
  assert.equal((html.match(/<tr>/g) || []).length, engine.pairs.length + 4 + 2);
});

test('rejection message and point name use the configured limits and a typographic minus', async () => {
  const { invalidText, customSite } = await import('../src/custom.js');
  const t = makeT(load('i18n/en.json'));
  assert.ok(invalidText(t, 'lat', LIMITS).includes('−90'));
  assert.ok(customSite(t, { lat: -89.45, lon_east: 222.69 }, 1737.4).name.includes('−89.45'));
});
