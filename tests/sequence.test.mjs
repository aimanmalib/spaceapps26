// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stepOffsets, dateRows, differs, summary, stepId } from '../src/sequence.js';
import { sampleAt } from '../src/ephem.js';

// Fixture: 4 hourly rows. Sun climbs from −1° to +2°; Earth fixed at +3° (always up), as in tests/shifts.test.mjs.
const table = {
  start: '2026-01-01T00:00Z',
  step_minutes: 60,
  sun: { az: [0, 30, 60, 90], el: [-1, 0, 1, 2] },
  earth: { az: [180, 180, 180, 180], el: [3, 3, 3, 3] },
};
const T0 = Date.UTC(2026, 0, 1, 0, 0);
const view = JSON.parse(readFileSync(new URL('../config/view.json', import.meta.url), 'utf8'));

test('stepOffsets: steps × stepHours after the chosen time', () => {
  assert.deepEqual(stepOffsets(3, 24), [24, 48, 72]);
  assert.deepEqual(stepOffsets(0, 24), []);
});

test('dateRows: chosen row first, changed answers flagged, rows outside the table have no answers', () => {
  const rows = dateRows(table, null, sampleAt(table, T0), T0, 4, 1, 0);
  assert.deepEqual(rows.map((r) => r.hours), [0, 1, 2, 3, 4]);
  assert.equal(rows[0].answers.sun.up, false);
  assert.deepEqual(rows.map((r) => r.changed), [false, false, true, true, false]);
  assert.equal(rows[4].answers, null);
  assert.deepEqual(summary(rows), { n: 4, sun: 2, earth: 4 });
});

test('dateRows: the terrain skyline decides, as on the card', () => {
  const wall = { azimuth_step_deg: 90, elev: [5, 5, 5, 5] };
  const rows = dateRows(table, wall, sampleAt(table, T0), T0, 3, 1, 0);
  assert.deepEqual(summary(rows), { n: 4, sun: 0, earth: 0 });
  assert.equal(rows[3].answers.earth.margin, -2);
});

test('differs: either answer counts; missing rows never count', () => {
  const a = { sun: { up: true }, earth: { up: false } };
  assert.equal(differs(a, { sun: { up: true }, earth: { up: true } }), true);
  assert.equal(differs(a, a), false);
  assert.equal(differs(a, null), false);
});

test('stepId: list order, wraps round, own coordinates go to the first or last site', () => {
  const ids = ['a', 'b', 'c'];
  assert.equal(stepId(ids, 'b', 1), 'c');
  assert.equal(stepId(ids, 'c', 1), 'a');
  assert.equal(stepId(ids, 'a', -1), 'c');
  assert.equal(stepId(ids, 'custom', 1), 'a');
  assert.equal(stepId(ids, 'custom', -1), 'c');
});

test('config/view.json sequence: whole positive numbers', () => {
  for (const k of ['button_step_hours', 'table_steps', 'table_step_hours']) {
    assert.ok(Number.isInteger(view.sequence[k]) && view.sequence[k] > 0, k);
  }
});
