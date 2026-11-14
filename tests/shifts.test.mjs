// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
import test from 'node:test';
import assert from 'node:assert/strict';
import { judge, timeRows, placeRows, changedCount, sphereTiltDeg } from '../src/shifts.js';

// Fixture: 4 hourly rows. Sun climbs from −1° to +2°, azimuth 0° → 90°; Earth fixed at az 180°, el +3°.
const table = {
  start: '2026-01-01T00:00Z',
  step_minutes: 60,
  sun: { az: [0, 30, 60, 90], el: [-1, 0, 1, 2] },
  earth: { az: [180, 180, 180, 180], el: [3, 3, 3, 3] },
};
const T0 = Date.UTC(2026, 0, 1, 0, 0);
const flat = (v) => ({ azimuth_step_deg: 90, elev: [v, v, v, v] });

test('judge: margin above the ideal sphere or the terrain skyline', () => {
  const s = { sun: { az: 0, el: 1.5 }, earth: { az: 180, el: 3 } };
  assert.deepEqual(judge(s, null, 0), { sun: { margin: 1.5, up: true }, earth: { margin: 3, up: true } });
  const j = judge(s, flat(2), 0);
  assert.equal(j.sun.up, false);
  assert.equal(j.sun.margin, -0.5);
  assert.equal(j.earth.up, true);
  assert.equal(judge(null, null, 0), null);
});

test('timeRows: moves the time, null answers outside the table', () => {
  const rows = timeRows(table, null, T0 + 3_600_000, [-1, 1, 5], 0);
  assert.deepEqual(rows.map((r) => r.hours), [-1, 1, 5]);
  assert.equal(rows[0].answers.sun.up, false); // 00:00, −1°
  assert.equal(rows[1].answers.sun.up, true); // 02:00, +1°
  assert.equal(rows[2].answers, null);
});

test('placeRows: each point uses its own table and skyline', () => {
  const rows = placeRows([{ dir: 'n', elev: [0, 0, 0, 0] }, { dir: 's', elev: [5, 5, 5, 5] }], [table, table], 90, T0 + 2 * 3_600_000, 0);
  assert.deepEqual(rows.map((r) => [r.dir, r.answers.sun.up]), [['n', true], ['s', false]]);
});

test('changedCount: counts rows where either answer differs', () => {
  const base = { sun: { up: true }, earth: { up: true } };
  const rows = [
    { answers: { sun: { up: true }, earth: { up: true } } },
    { answers: { sun: { up: false }, earth: { up: true } } },
    { answers: null },
  ];
  assert.equal(changedCount(base, rows), 1);
});

test('sphereTiltDeg: 1 km on a 1737.4 km sphere ≈ 0.033°', () => {
  assert.ok(Math.abs(sphereTiltDeg(1, 1737.4) - 0.033) < 0.001);
});
