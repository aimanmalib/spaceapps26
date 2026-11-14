// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseUtc, formatUtc, tableRange, lerpAngle, sampleAt, isAbove, sharedScale } from '../src/ephem.js';
import { skySvg, yFor, VIEW } from '../src/sky.js';

// Fixed fixture (not project data): 3 hourly rows.
const T = {
  start: '2026-11-14T00:00Z', step_minutes: 60,
  sun: { az: [350, 10, 30], el: [-1, 1, 3] },
  earth: { az: [100, 110, 120], el: [5, 4, 3] },
};

test('parseUtc reads datetime-local values as UTC and rejects junk', () => {
  assert.equal(parseUtc('2026-11-14T00:00'), Date.UTC(2026, 10, 14, 0, 0));
  assert.equal(parseUtc('2026-11-14T00:00Z'), Date.UTC(2026, 10, 14, 0, 0));
  assert.ok(Number.isNaN(parseUtc('')));
  assert.ok(Number.isNaN(parseUtc('14/11/2026')));
  assert.equal(formatUtc(Date.UTC(2026, 10, 14, 5, 7)), '2026-11-14T05:07');
});

test('tableRange spans first to last row', () => {
  const r = tableRange(T);
  assert.equal(r.endMs - r.startMs, 2 * 3600_000);
});

test('lerpAngle takes the short way across north', () => {
  assert.equal(lerpAngle(350, 10, 0.5), 0);
  assert.ok(Math.abs(lerpAngle(10, 350, 0.25) - 5) < 1e-9);
  assert.equal(lerpAngle(100, 110, 0.5), 105);
});

test('sampleAt interpolates between rows, hits rows exactly, and is null outside', () => {
  const t0 = parseUtc(T.start);
  const mid = sampleAt(T, t0 + 30 * 60_000);
  assert.equal(mid.sun.el, 0);
  assert.equal(mid.sun.az, 0);
  assert.equal(mid.earth.el, 4.5);
  const last = sampleAt(T, t0 + 2 * 3600_000);
  assert.deepEqual(last, { sun: { az: 30, el: 3 }, earth: { az: 120, el: 3 } });
  assert.equal(sampleAt(T, t0 - 1), null);
  assert.equal(sampleAt(T, t0 + 2 * 3600_000 + 1), null);
  assert.equal(sampleAt(T, NaN), null);
});

test('isAbove: strictly above the threshold', () => {
  assert.equal(isAbove(0.01, 0), true);
  assert.equal(isAbove(0, 0), false);
  assert.equal(isAbove(-3, 0), false);
});

test('sharedScale picks the smallest step that fits all elevations', () => {
  const steps = [10, 20, 45, 90];
  assert.equal(sharedScale([1.5, -5.04], steps), 10);
  assert.equal(sharedScale([12, -3], steps), 20);
  assert.equal(sharedScale([-60], steps), 90);
  assert.equal(sharedScale([], steps), 10);
});

test('sky panorama: horizon in the middle, below-horizon markers drawn hollow', () => {
  assert.equal(yFor(0, 10), VIEW.h / 2);
  assert.ok(yFor(5, 10) < VIEW.h / 2);
  assert.equal(yFor(50, 10), yFor(10, 10));
  const svg = skySvg({ sun: { az: 263.9, el: 1.5 }, earth: { az: 136, el: -5 } }, 10, { sun: true, earth: false });
  assert.match(svg, /class="sky-sun is-up" cx="263.90"/);
  assert.match(svg, /class="sky-earth is-down" cx="136.00"/);
});

test('real frozen data: the engineering check point matches its recorded Horizons row', () => {
  const cfg = JSON.parse(readFileSync(new URL('../config/ephemeris.json', import.meta.url), 'utf8'));
  const cp = cfg.check_points[0];
  const raw = JSON.parse(readFileSync(new URL(`../data/check/${cp.id}.json`, import.meta.url), 'utf8'));
  const s = sampleAt(raw, parseUtc(cp.start));
  assert.ok(Math.abs(s.sun.el - cp.expect_first_row.sun_el) <= cp.expect_first_row.tolerance_deg);
  assert.ok(Math.abs(s.earth.el - cp.expect_first_row.earth_el) <= cp.expect_first_row.tolerance_deg);
});
