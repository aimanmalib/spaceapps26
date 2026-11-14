// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseUtc } from '../src/ephem.js';
import { nextChange, prevChange, windowAt, durationParts } from '../src/windows.js';
import { bodyFacts, signedDeg, duration } from '../src/facts.js';
import { glanceHtml } from '../src/glance.js';
import { makeT } from '../src/i18n.js';
import { readFileSync } from 'node:fs';

const H = 3600_000;
// Fixed fixture (not project data): hourly rows. Sun: down, up from 1.5 h to 4.5 h, down. Earth: up the whole table.
const T = {
  start: '2026-11-14T00:00Z', step_minutes: 60,
  sun: { az: [0, 0, 0, 0, 0, 0, 0], el: [-2, -1, 1, 2, 1, -1, -2] },
  earth: { az: [0, 0, 0, 0, 0, 0, 0], el: [5, 5, 5, 5, 5, 5, 5] },
};
const t0 = parseUtc(T.start);
const view = { horizon_threshold_deg: 0, decimals: 1 };
const t = makeT(JSON.parse(readFileSync(new URL('../i18n/en.json', import.meta.url), 'utf8')));

test('nextChange / prevChange find the interpolated horizon crossings', () => {
  assert.equal(nextChange(T, 'sun', t0, false), t0 + 1.5 * H);
  assert.equal(nextChange(T, 'sun', t0 + 2 * H, true), t0 + 4.5 * H);
  assert.equal(prevChange(T, 'sun', t0 + 3 * H, true), t0 + 1.5 * H);
  assert.equal(nextChange(T, 'earth', t0, true), null);
  assert.equal(prevChange(T, 'earth', t0 + 3 * H, true), null);
});

test('windowAt: current window when up, next window when down, open at table edges', () => {
  const now = windowAt(T, t0 + 2 * H, 'sun', true);
  assert.deepEqual([now.start, now.end, now.startOpen, now.endOpen], [t0 + 1.5 * H, t0 + 4.5 * H, false, false]);
  const next = windowAt(T, t0 + 0.5 * H, 'sun', false);
  assert.deepEqual([next.start, next.end, next.none], [t0 + 1.5 * H, t0 + 4.5 * H, false]);
  const none = windowAt(T, t0 + 5 * H, 'sun', false);
  assert.equal(none.none, true);
  const earth = windowAt(T, t0 + 3 * H, 'earth', true);
  assert.deepEqual([earth.start, earth.end, earth.startOpen, earth.endOpen], [t0, t0 + 6 * H, true, true]);
});

test('windowAt at the very last table row does not read past the table', () => {
  const w = windowAt(T, t0 + 6 * H, 'sun', false);
  assert.equal(w.none, true);
});

test('durationParts keeps the two largest units and rounds to minutes', () => {
  assert.deepEqual(durationParts(3 * 24 * H + 4 * H + 59 * 60_000), [{ n: 3, unit: 'd' }, { n: 4, unit: 'h' }]);
  assert.deepEqual(durationParts(2 * 24 * H + 30 * 60_000), [{ n: 2, unit: 'd' }]);
  assert.deepEqual(durationParts(90 * 60_000 + 20_000), [{ n: 1, unit: 'h' }, { n: 30, unit: 'min' }]);
  assert.deepEqual(durationParts(10_000), [{ n: 0, unit: 'min' }]);
  assert.equal(duration((u) => ({ 'dur.h': '{n} h', 'dur.min': '{n} min' })[u], 90 * 60_000), '1 h 30 min');
});

test('signedDeg uses + and a true minus, and no sign for zero', () => {
  assert.equal(signedDeg(1.53, 1), '+1.5°');
  assert.equal(signedDeg(-5.04, 1), '−5.0°');
  assert.equal(signedDeg(-0.01, 1), '0.0°');
});

test('bodyFacts: up → time to set + this window; down → time to rise + next window; open → "at least"', () => {
  const up = bodyFacts(t, T, t0 + 2 * H, 'sun', 1, true, view);
  assert.match(up.timing, /^Sunset in 2 h 30 min$/);
  assert.match(up.window, /3 h/);
  assert.match(up.range, /2026-11-14 01:30 to 2026-11-14 04:30 UTC/);
  const down = bodyFacts(t, T, t0, 'sun', -2, false, view);
  assert.match(down.timing, /^Sunrise in 1 h 30 min$/);
  assert.match(down.windowShort, /^next: 3 h$/);
  const none = bodyFacts(t, T, t0 + 5 * H, 'sun', -1, false, view);
  assert.match(none.timing, /^No sunrise before the end of the data/);
  assert.equal(none.window, null);
  const earth = bodyFacts(t, T, t0 + 3 * H, 'earth', 5, true, view);
  assert.match(earth.timing, /^No Earthset before the end of the data \(2026-11-14 06:00 UTC\)$/);
  assert.match(earth.window, /at least 6 h/);
});

test('glanceHtml: one column per scenario, "No data" for a scenario outside the table', () => {
  const facts = { sun: bodyFacts(t, T, t0 + 2 * H, 'sun', 1, true, view), earth: bodyFacts(t, T, t0 + 2 * H, 'earth', 5, true, view) };
  const html = glanceHtml(t, [
    { site: { name: 'Site <A>' }, ms: t0 + 2 * H, facts },
    { site: { name: 'Site B' }, ms: NaN, msg: 'x' },
  ]);
  assert.equal((html.match(/<th scope="col">/g) || []).length, 2);
  assert.ok(html.includes('Site &lt;A&gt;'));
  assert.ok(html.includes('Sunset in 2 h 30 min'));
  assert.ok(html.includes(t('glance.no_data')));
});
