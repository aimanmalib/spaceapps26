// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { bothUp, runs, findWindows, bothShare } from '../src/mission.js';
import { relativeTable } from '../src/terrain.js';
import { parseUtc } from '../src/ephem.js';

const HOUR = 3_600_000;
const load = (rel) => JSON.parse(readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8'));
const T0 = Date.UTC(2026, 0, 1, 0, 0);
const synth = (sun, earth) => ({
  start: '2026-01-01T00:00Z',
  step_minutes: 60,
  sun: { az: sun.map(() => 0), el: sun },
  earth: { az: earth.map(() => 0), el: earth },
});

// Brute force: row k is inside a qualifying window when some stretch of consecutive "both up" rows that contains k
// spans at least minRows steps (first to last row).
function bruteRows(flags, minRows) {
  const n = flags.length;
  return flags.map((f, k) => {
    if (!f) return false;
    let a = k;
    let b = k;
    while (a > 0 && flags[a - 1]) a--;
    while (b < n - 1 && flags[b + 1]) b++;
    return b - a >= minRows;
  });
}

function rowsFromWindows(table, wins) {
  const flags = table.sun.el.map(() => false);
  for (const w of wins) for (let ms = w.start; ms <= w.end; ms += HOUR) flags[(ms - T0) / HOUR] = true;
  return flags;
}

test('runs / bothUp: both bodies must be above the threshold; strict, as on the card', () => {
  const t = synth([1, 1, 0, 1, 1, 1, -1], [1, 1, 1, 1, 0.5, 1, 1]);
  assert.deepEqual(bothUp(t), [true, true, false, true, true, true, false]);
  assert.deepEqual(runs(bothUp(t)), [{ i0: 0, i1: 1 }, { i0: 3, i1: 5 }]);
  assert.deepEqual(runs([true, true]), [{ i0: 0, i1: 1 }]);
  assert.deepEqual(runs([]), []);
});

test('findWindows: length filter, start time, open edges, current window, max listed', () => {
  const t = synth([1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
  const all = findWindows(t, T0, 0);
  assert.deepEqual(all.map((w) => [(w.start - T0) / HOUR, (w.end - T0) / HOUR]), [[0, 2], [4, 7], [9, 10]]);
  assert.equal(all[0].startOpen, true);
  assert.equal(all[2].endOpen, true);
  assert.equal(all[0].current, true);
  assert.deepEqual(findWindows(t, T0, 3).map((w) => w.ms / HOUR), [3]);
  const later = findWindows(t, T0 + 5 * HOUR, 0);
  assert.equal(later[0].current, true);
  assert.equal((later[0].start - T0) / HOUR, 4);
  assert.equal(findWindows(t, T0, 0, 0, 2).length, 2);
  assert.deepEqual(findWindows(t, T0, 4), []);
  assert.equal(bothShare(t), 9 / 11);
});

test('findWindows = brute force on random series (fixed seed)', () => {
  let s = 12345;
  const rnd = () => ((s = (s * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
  for (let trial = 0; trial < 50; trial++) {
    const n = 40 + Math.floor(rnd() * 80);
    const sun = Array.from({ length: n }, () => (rnd() < 0.8 ? 1 : -1) * rnd() * 5);
    const earth = Array.from({ length: n }, () => (rnd() < 0.85 ? 1 : -1) * rnd() * 5);
    const t = synth(sun, earth);
    for (const minRows of [0, 1, 3, 6]) {
      const got = rowsFromWindows(t, findWindows(t, T0 - 1, minRows));
      assert.deepEqual(got, bruteRows(bothUp(t), minRows), `trial ${trial} min ${minRows}`);
    }
  }
});

test('real site (IM-2, terrain horizon): windows hold both answers on every row, bounded by a break; share counted', () => {
  const view = load('config/view.json');
  const table = load('data/ephem/im-2.json');
  const rel = relativeTable(table, load('data/horizon/im-2.json'));
  const th = view.horizon_threshold_deg;
  const flags = bothUp(rel, th);
  const startMs = parseUtc(rel.start);
  const step = rel.step_minutes * 60_000;
  const wins = findWindows(rel, startMs - 1, view.windows.default_min_hours, th);
  assert.ok(wins.length > 0);
  for (const w of wins) {
    const i0 = (w.start - startMs) / step;
    const i1 = (w.end - startMs) / step;
    assert.ok(w.ms >= view.windows.default_min_hours * HOUR);
    for (let k = i0; k <= i1; k++) assert.equal(flags[k], true);
    assert.ok(i0 === 0 || !flags[i0 - 1]);
    assert.ok(i1 === flags.length - 1 || !flags[i1 + 1]);
  }
  assert.deepEqual(rowsFromWindowsReal(rel, wins, startMs, step), bruteRows(flags, view.windows.default_min_hours * HOUR / step));
  const share = bothShare(rel, th);
  assert.equal(share, flags.filter(Boolean).length / flags.length);
  assert.ok(share > 0 && share < 1);
});

function rowsFromWindowsReal(rel, wins, startMs, step) {
  const flags = rel.sun.el.map(() => false);
  for (const w of wins) for (let k = (w.start - startMs) / step; k <= (w.end - startMs) / step; k++) flags[k] = true;
  return flags;
}

test('config: window lengths and list size', () => {
  const { windows, first_card: fc } = load('config/view.json');
  assert.ok(windows.min_hours_options.includes(windows.default_min_hours));
  assert.ok(windows.min_hours_options.every((h) => Number.isInteger(h) && h > 0));
  assert.ok(windows.max_listed >= 1);
  assert.equal(typeof fc.windows_open, 'boolean');
});
