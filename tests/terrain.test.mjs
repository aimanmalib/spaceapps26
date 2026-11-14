// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Item j in the page: skyline interpolation, visibility against the skyline, windows on the relative table, panorama.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { horizonAt, relativeTable, aboveHorizon, visibleShare } from '../src/terrain.js';
import { windowAt } from '../src/windows.js';
import { skySvg } from '../src/sky.js';

// Fixture: 4 samples, 90° apart: N 0°, E 2°, S 4°, W −2°.
const profile = { azimuth_step_deg: 90, observer_height_m: 2, elev: [0, 2, 4, -2] };

test('horizonAt interpolates linearly and wraps at 360°', () => {
  assert.equal(horizonAt(profile, 0), 0);
  assert.equal(horizonAt(profile, 45), 1);
  assert.equal(horizonAt(profile, 135), 3);
  assert.equal(horizonAt(profile, 315), -1);
  assert.equal(horizonAt(profile, 360), 0);
  assert.equal(horizonAt(profile, -45), -1);
  assert.equal(horizonAt(profile, 405), 1);
});

test('a body above the sphere but below the skyline is not visible; without a profile the sphere counts', () => {
  const sun = { az: 180, el: 3 };
  assert.equal(aboveHorizon(sun, profile), -1);
  assert.equal(aboveHorizon(sun, null), 3);
  assert.equal(aboveHorizon({ az: 270, el: -1 }, profile), 1);
});

// Hourly table, Sun at az 180 (skyline 4°), elevation rising 0..8 then falling.
const el = [0, 2, 4, 6, 8, 6, 4, 2, 0];
const table = {
  start: '2026-11-01T00:00Z', step_minutes: 60,
  sun: { az: el.map(() => 180), el },
  earth: { az: el.map(() => 270), el: el.map(() => -1) },
};

test('relativeTable subtracts the skyline per row and leaves azimuth alone', () => {
  const rel = relativeTable(table, profile);
  assert.deepEqual(rel.sun.el, el.map((v) => v - 4));
  assert.deepEqual(rel.earth.el, el.map(() => 1));
  assert.equal(rel.sun.az, table.sun.az);
  assert.equal(relativeTable(table, null), table);
});

test('sunrise/sunset against the skyline come later/earlier than against the sphere', () => {
  const ms = Date.parse('2026-11-01T04:00Z');
  const sphere = windowAt(table, ms, 'sun', true, 0);
  const terrain = windowAt(relativeTable(table, profile), ms, 'sun', true, 0);
  assert.equal(terrain.start, Date.parse('2026-11-01T02:00Z'));
  assert.equal(terrain.end, Date.parse('2026-11-01T06:00Z'));
  assert.ok(sphere.end - sphere.start > terrain.end - terrain.start);
});

test('visibleShare counts rows with any part of the disc above the skyline (PGDA rule)', () => {
  assert.equal(visibleShare(table, profile, 'sun', 0), 3 / 9);
  assert.equal(visibleShare(table, profile, 'sun', 0.5), 5 / 9);
  assert.equal(visibleShare(table, profile, 'sun', 2.5), 7 / 9);
  assert.equal(visibleShare(table, null, 'earth', 0.95), 0);
  assert.equal(visibleShare(table, profile, 'earth', 0.95), 1);
});

test('panorama draws the terrain skyline and the dashed sphere line only when a profile exists', () => {
  const sample = { sun: { az: 180, el: 3 }, earth: { az: 270, el: -1 } };
  const up = { sun: false, earth: true };
  const withTerrain = skySvg(sample, 10, up, profile);
  assert.match(withTerrain, /class="sky-terrain" points="0\.0,/);
  assert.match(withTerrain, /class="sky-sphere"/);
  assert.doesNotMatch(withTerrain, /class="sky-horizon"/);
  const sphere = skySvg(sample, 10, up);
  assert.doesNotMatch(sphere, /sky-terrain/);
  assert.match(sphere, /class="sky-horizon"/);
});

test('card answers state the skyline elevation in the body direction only when terrain is used', async () => {
  const { resultHtml } = await import('../src/result.js');
  const { makeT } = await import('../src/i18n.js');
  const { readFileSync } = await import('node:fs');
  const t = makeT(JSON.parse(readFileSync(new URL('../i18n/en.json', import.meta.url), 'utf8')));
  const f = (up) => ({ up, elText: '+3.0°', margin: up ? 1 : -1, marginText: up ? '+1.0°' : '−1.0°', timing: 'x', window: null, range: null });
  const r = {
    site: { lat: -80, lon_east: 1, source: { url: 'https://example.invalid/', publisher: 'p' } },
    sample: { sun: { az: 180, el: 3 }, earth: { az: 90, el: 3 } }, up: { sun: false, earth: true },
    facts: { sun: f(false), earth: f(true) }, scale: 10,
  };
  const view = { decimals: 1, horizon_threshold_deg: 0, near_horizon_deg: 10 };
  const terrainHtml = resultHtml(t, { ...r, profile }, view);
  assert.ok(terrainHtml.includes('terrain skyline in that direction +4.0°'));
  assert.ok(terrainHtml.includes('terrain skyline in that direction +2.0°'));
  assert.ok(terrainHtml.includes(t('horizon.terrain')));
  const sphereHtml = resultHtml(t, { ...r, profile: null }, view);
  assert.ok(!sphereHtml.includes('terrain skyline in that direction'));
  assert.ok(sphereHtml.includes(t('horizon.sphere')));
});
