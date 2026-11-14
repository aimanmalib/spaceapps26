// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { separationDeg, rateAt, azimuthSpan, earthSpread, horizonKm, meanSunRate } from '../src/moonearth.js';

// Fixture: 3 hourly rows. Sun moves 1° in azimuth along the horizon per hour; Earth fixed, then 2° up.
const table = {
  start: '2026-01-01T00:00Z',
  step_minutes: 60,
  sun: { az: [359.5, 0.5, 1.5], el: [0, 0, 0] },
  earth: { az: [350, 10, 10], el: [3, 3, 5] },
};
const T0 = Date.UTC(2026, 0, 1, 0, 0);
const near = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) < tol, `${a} ≉ ${b}`);

test('separationDeg: along the horizon, across the wrap, and straight up', () => {
  near(separationDeg({ az: 359.5, el: 0 }, { az: 0.5, el: 0 }), 1);
  near(separationDeg({ az: 10, el: 0 }, { az: 200, el: 90 }), 90);
  near(separationDeg({ az: 42, el: 7 }, { az: 42, el: 7 }), 0);
});

test('rateAt: degrees per hour between the rows around the time; null outside the table', () => {
  near(rateAt(table, T0 + 1_800_000, 'sun'), 1);
  near(rateAt(table, T0 + 2 * 3_600_000, 'earth'), 2); // last row uses the last interval
  near(rateAt({ ...table, step_minutes: 30 }, T0, 'sun'), 2);
  assert.equal(rateAt(table, T0 - 1, 'sun'), null);
  assert.equal(rateAt(table, NaN, 'sun'), null);
});

test('azimuthSpan: smallest arc, across 0°', () => {
  assert.equal(azimuthSpan([350, 10, 5]), 20);
  assert.equal(azimuthSpan([10, 20, 30]), 20);
  assert.equal(azimuthSpan([0, 120, 240]), 240);
  assert.equal(azimuthSpan([7]), 0);
});

test('earthSpread: azimuth range and elevation extremes over the table', () => {
  const s = earthSpread(table);
  assert.deepEqual([s.az, s.elMin, s.elMax, s.from, s.to], [20, 3, 5, T0, T0 + 2 * 3_600_000]);
});

test('horizonKm and meanSunRate', () => {
  near(horizonKm(1737.4, 2), Math.sqrt(2 * 1737400 * 2 + 4) / 1000);
  assert.ok(horizonKm(1737.4, 2) < horizonKm(6371, 2));
  near(meanSunRate(24), 15);
});

test('config/moon-earth.json: every quoted value has a NASA source and the right shape', () => {
  const me = JSON.parse(readFileSync(new URL('../config/moon-earth.json', import.meta.url), 'utf8'));
  for (const s of Object.values(me.sources)) assert.match(s.url, /^https:\/\/[a-z.]*(nasa\.gov|spaceappschallenge\.org)\//);
  for (const k of ['synodic_period_days', 'radius_km']) assert.ok(me.moon[k] > 0);
  for (const k of ['length_of_day_hours', 'radius_km']) assert.ok(me.earth[k] > 0);
  assert.equal(typeof me.moon.surface_pressure_text, 'string');
  assert.equal(typeof me.earth.surface_pressure_text, 'string');
  assert.ok(me.challenge_quote.length > 0 && me.observer_height_m > 0 && Number.isInteger(me.decimals));
});
