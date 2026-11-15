// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { periodRows, longestRun, discFraction, rowPower, missionMetrics, decide } from '../src/metrics.js';
import { reasonText } from '../src/metrics-ui.js';
import { relativeTable } from '../src/terrain.js';
import { parseUtc } from '../src/ephem.js';
import { makeT } from '../src/i18n.js';

const HOUR = 3_600_000;
const load = (rel) => JSON.parse(readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8'));
const cfg = load('config/metrics.json');
const view = load('config/view.json');
const T0 = Date.UTC(2026, 0, 1, 0, 0);
const synth = (sun, earth, sunEl = sun) => ({
  start: '2026-01-01T00:00Z',
  step_minutes: 60,
  sun: { az: sun.map(() => 0), el: sunEl },
  earth: { az: earth.map(() => 0), el: earth },
});
const opts = { threshold: 0, solar: 1361, sunRadius: 0.267 };

test('config/metrics.json: default period is one of the options, thresholds as agreed', () => {
  assert.ok(cfg.period_days_options.includes(cfg.default_period_days));
  assert.deepEqual(cfg.period_days_options, [7, 14, 29.5]);
  assert.equal(cfg.default_period_days, 7);
  assert.ok(cfg.period_days_options.includes(cfg.week_days));
  assert.equal(cfg.solar_constant_w_m2, 1361);
  assert.deepEqual(cfg.decision, { sun_min_pct: 70, earth_min_pct: 50, night_max_hours: 72 });
});

test('periodRows: rows in [from, from + days), truncated at the table end', () => {
  const t = synth(Array(100).fill(1), Array(100).fill(1));
  assert.deepEqual(periodRows(t, T0, 1).k0, 0);
  assert.equal(periodRows(t, T0, 1).k1, 24);
  const mid = periodRows(t, T0 + 30 * 60_000, 1); // half past: first row is the next whole hour
  assert.equal(mid.k0, 1);
  assert.equal(mid.k1, 25);
  const late = periodRows(t, T0 + 90 * HOUR, 1);
  assert.equal(late.k1, 100);
  assert.equal(late.truncated, true);
  assert.equal(late.endMs, T0 + 99 * HOUR);
  assert.equal(periodRows(t, T0, 1).truncated, false);
});

test('longestRun: longest run, open edges, none', () => {
  assert.deepEqual(longestRun([false, true, true, false, true]), { rows: 2, i0: 1, i1: 2, startOpen: false, endOpen: false });
  assert.equal(longestRun([true, true, false]).startOpen, true);
  assert.equal(longestRun([false, true, true]).endOpen, true);
  assert.equal(longestRun([false, false]).rows, 0);
  assert.equal(longestRun([]).rows, 0);
});

test('discFraction: half at the centre, whole above one radius, none below; monotone', () => {
  assert.equal(discFraction(0, 0.267), 0.5);
  assert.equal(discFraction(0.3, 0.267), 1);
  assert.equal(discFraction(-0.3, 0.267), 0);
  assert.ok(Math.abs(discFraction(0.1, 0.267) + discFraction(-0.1, 0.267) - 1) < 1e-12);
  let prev = -1;
  for (let m = -0.3; m <= 0.3; m += 0.01) {
    const f = discFraction(m, 0.267);
    assert.ok(f >= prev);
    prev = f;
  }
});

test('rowPower: vertical tracking = cos(el), flat = sin(el), times the visible disc share', () => {
  const p = rowPower(30, 5, 1361, 0.267);
  assert.ok(Math.abs(p.tracking - 1361 * Math.cos(Math.PI / 6)) < 1e-9);
  assert.ok(Math.abs(p.flat - 1361 / 2) < 1e-9);
  assert.deepEqual(rowPower(30, -1, 1361, 0.267), { tracking: 0, flat: 0 });
  assert.equal(rowPower(-1, 2, 1361, 0.267).flat, 0); // terrain below 0°: Sun above the skyline, flat panel gets nothing
  const half = rowPower(1.5, 0, 1361, 0.267);
  assert.ok(Math.abs(half.tracking - 1361 * Math.cos((1.5 * Math.PI) / 180) * 0.5) < 1e-9);
});

test('missionMetrics: shares, longest night and Earth gap, mean power on a small table', () => {
  // 10 hours: Sun up 0-3, down 4-8 (5 h), up 9; Earth up except 2-3.
  const sun = [1, 1, 1, 1, -1, -1, -1, -1, -1, 1];
  const earth = [1, 1, -1, -1, 1, 1, 1, 1, 1, 1];
  const t = synth(sun, earth);
  const m = missionMetrics(t, t, T0, 10 / 24, opts);
  assert.equal(m.rows, 10);
  assert.equal(m.sunPct, 50);
  assert.equal(m.earthPct, 80);
  assert.equal(m.bothPct, 30);
  assert.deepEqual(m.night, { hours: 5, open: false, all: false });
  assert.deepEqual(m.gap, { hours: 2, open: false, all: false });
  const each = rowPower(1, 1, 1361, 0.267);
  assert.ok(Math.abs(m.power.tracking - (each.tracking * 5) / 10) < 1e-9);
  // Whole period dark: the run is open and covers every row.
  const dark = synth(Array(5).fill(-2), Array(5).fill(1));
  const d = missionMetrics(dark, dark, T0, 5 / 24, opts);
  assert.deepEqual(d.night, { hours: 5, open: true, all: true });
  assert.equal(d.power.tracking, 0);
});

test('decide: GO, RISKY for one failing check, NO-GO for two or more; limits inclusive', () => {
  const r = cfg.decision;
  const m = (sunPct, earthPct, hours) => ({ sunPct, earthPct, night: { hours } });
  assert.deepEqual(decide(m(70, 50, 72), r), { decision: 'go', fails: [] });
  assert.deepEqual(decide(m(69.9, 50, 72), r), { decision: 'risky', fails: ['sun'] });
  assert.deepEqual(decide(m(80, 49, 72), r), { decision: 'risky', fails: ['earth'] });
  assert.deepEqual(decide(m(80, 60, 73), r), { decision: 'risky', fails: ['night'] });
  assert.deepEqual(decide(m(40, 60, 300), r), { decision: 'nogo', fails: ['sun', 'night'] });
  assert.equal(decide(m(0, 0, 700), r).decision, 'nogo');
});

test('reasonText: one line naming the failing checks in every language', () => {
  const r = cfg.decision;
  for (const lang of ['en', 'id', 'ms']) {
    const t = makeT(load(`i18n/${lang}.json`));
    const m = { sunPct: 43.84, earthPct: 80, night: { hours: 120 } };
    const line = reasonText(t, m, r, decide(m, r), 1);
    assert.ok(line.includes('43.8') && line.includes('120') && line.includes('72'), `${lang}: ${line}`);
    assert.ok(!line.includes('{'), `${lang}: no unfilled placeholder`);
    assert.equal(line[0], line[0].toUpperCase(), `${lang}: starts with a capital`);
    const night = { sunPct: 90, earthPct: 90, night: { hours: 74 } };
    const one = reasonText(t, night, r, decide(night, r), 1);
    assert.equal(one[0], one[0].toUpperCase(), `${lang}: ${one}`);
    const ok = { sunPct: 90, earthPct: 100, night: { hours: 10 } };
    assert.ok(!reasonText(t, ok, r, decide(ok, r), 1).includes('{'));
  }
});

test('real tables: IM-2 from 2026-11-14 over one lunar day is not GO; numbers in range; 14 days counts fewer rows', () => {
  const table = load('data/ephem/im-2.json');
  const rel = relativeTable(table, load('data/horizon/im-2.json'));
  const ms = parseUtc('2026-11-14T00:00');
  const o = { threshold: view.horizon_threshold_deg, solar: cfg.solar_constant_w_m2, sunRadius: view.timeline.year.disc_radius_deg.sun };
  const m = missionMetrics(table, rel, ms, 29.5, o);
  assert.equal(m.rows, 708);
  // A lunar day holds a two-week night almost everywhere: IM-2 fails the Sun and night checks.
  assert.deepEqual(decide(m, cfg.decision), { decision: 'nogo', fails: ['sun', 'night'] });
  assert.equal(m.truncated, false);
  for (const p of [m.sunPct, m.earthPct, m.bothPct]) assert.ok(p >= 0 && p <= 100);
  assert.ok(m.bothPct <= Math.min(m.sunPct, m.earthPct));
  // Polar site: the Sun is low, so a vertical panel turning to it collects far more than a flat one.
  assert.ok(m.power.tracking > 5 * m.power.flat, JSON.stringify(m.power));
  assert.ok(m.power.tracking <= 1361);
  assert.equal(missionMetrics(table, rel, ms, 14, o).rows, 336);
  // Near the end of the data the period is cut and says so.
  const end = missionMetrics(table, rel, parseUtc('2027-10-25T00:00'), 29.5, o);
  assert.equal(end.truncated, true);
});

test('real tables: a lit polar ridge (Shackleton ridge) reaches GO over one lunar day from 2026-11-01', () => {
  const table = load('data/ephem/shackleton-ridge.json');
  const rel = relativeTable(table, load('data/horizon/shackleton-ridge.json'));
  const o = { threshold: view.horizon_threshold_deg, solar: cfg.solar_constant_w_m2, sunRadius: view.timeline.year.disc_radius_deg.sun };
  const m = missionMetrics(table, rel, parseUtc('2026-11-01T00:00'), 29.5, o);
  assert.equal(decide(m, cfg.decision).decision, 'go', JSON.stringify(m));
});

test('real tables: the default cards (IM-2, 2026-11-14 and 16) are GO over the default one surface week', () => {
  const table = load('data/ephem/im-2.json');
  const rel = relativeTable(table, load('data/horizon/im-2.json'));
  const o = { threshold: view.horizon_threshold_deg, solar: cfg.solar_constant_w_m2, sunRadius: view.timeline.year.disc_radius_deg.sun };
  for (const sc of view.default_scenarios) {
    const m = missionMetrics(table, rel, parseUtc(sc.time_utc), cfg.default_period_days, o);
    assert.equal(m.rows, 168);
    assert.equal(decide(m, cfg.decision).decision, 'go', `${sc.time_utc}: ${JSON.stringify(m)}`);
  }
});

test('i18n: the week option label names the length and does not claim a mission', () => {
  for (const lang of ['en', 'id', 'ms']) {
    const v = load(`i18n/${lang}.json`)['metrics.days_week'];
    assert.ok(v.includes('{n}'), `${lang}: ${v}`);
  }
  assert.equal(load('i18n/en.json')['metrics.days_week'].replace('{n}', '7'), '7 d (one surface week)');
});
