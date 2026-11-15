// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// First-load motion (ADR 0112) on a real frozen table (IM-2): the lunar day played, that the last frame is exactly the chosen
// time (so the strip ends as drawn), that the Sun goes once around, and that it never plays under automation or reduced motion.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dayWindow, frameSample, shouldPlay, playFirstDay } from '../src/first-day.js';
import { sampleAt, tableRange } from '../src/ephem.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (p) => JSON.parse(readFileSync(root + p, 'utf8'));
const view = read('config/view.json');
const cfg = view.first_load_motion;
const table = read('data/ephem/im-2.json');
const DAY = 86_400_000;
const { startMs, endMs } = tableRange(table);
const span = cfg.lunar_day_days * DAY;

test('first day: config is there and short', () => {
  assert.ok(cfg.duration_ms >= 3000 && cfg.duration_ms <= 8000);
  assert.ok(cfg.lunar_day_days > 29 && cfg.lunar_day_days < 30);
  assert.ok(cfg.land_fraction > 0 && cfg.land_fraction < 0.5);
});

test('first day: the lunar day that ends at the chosen time, else the one that starts there, else none', () => {
  const late = startMs + 60 * DAY;
  assert.deepEqual(dayWindow(table, late, cfg), { from: late - span, to: late });
  const early = startMs + 13 * DAY; // the default one-kilometre date: less than a lunar day of table before it
  assert.deepEqual(dayWindow(table, early, cfg), { from: early, to: early + span });
  const short = { ...table, sun: { az: table.sun.az.slice(0, 200), el: table.sun.el.slice(0, 200) }, earth: { az: table.earth.az.slice(0, 200), el: table.earth.el.slice(0, 200) } };
  assert.equal(dayWindow(short, startMs + 100 * 3_600_000, cfg), null);
  assert.equal(dayWindow(table, endMs + DAY, cfg), null);
});

test('first day: the last frame is exactly the chosen time; the Sun goes once around on the way', () => {
  for (const ms of [startMs + 13 * DAY, startMs + 60 * DAY]) {
    const win = dayWindow(table, ms, cfg);
    assert.deepEqual(frameSample(table, win, ms, 1, cfg), sampleAt(table, ms));
    let turn = 0;
    let prev = frameSample(table, win, ms, 0, cfg).sun.az;
    for (let k = 1; k <= 400; k++) {
      const az = frameSample(table, win, ms, k / 400, cfg).sun.az;
      turn += ((((az - prev) % 360) + 540) % 360) - 180;
      prev = az;
    }
    assert.ok(Math.abs(Math.abs(turn) - 360) < 20, `Sun turned ${turn.toFixed(1)}° at ${new Date(ms).toISOString()}`);
  }
});

test('first day: never under automation, with reduced motion or in a hidden tab', () => {
  assert.equal(shouldPlay({ reducedMotion: false, webdriver: false, visible: true }), true);
  assert.equal(shouldPlay({ reducedMotion: true, webdriver: false, visible: true }), false);
  assert.equal(shouldPlay({ reducedMotion: false, webdriver: true, visible: true }), false);
  assert.equal(shouldPlay({ reducedMotion: false, webdriver: false, visible: false }), false);
  let frames = 0;
  const win = { requestAnimationFrame: () => frames++, matchMedia: () => ({ matches: false }), navigator: { webdriver: true }, document: { visibilityState: 'visible' } };
  const plot = { querySelector: () => { throw new Error('the strip must not be touched'); } };
  const ms = startMs + 60 * DAY;
  assert.equal(playFirstDay(plot, { table, ms, sample: sampleAt(table, ms), profile: null }, view, win), false);
  assert.equal(frames, 0);
});
