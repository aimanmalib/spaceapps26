// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Download CSV (ADR 0110): rows, cells, file name; the yes/no columns agree with the Mission check (src/metrics.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { hourlyRows, csvText, csvName, csvField, siteSlug, CSV_COLUMNS } from '../src/csv.js';
import { missionMetrics } from '../src/metrics.js';
import { relativeTable } from '../src/terrain.js';
import { parseUtc } from '../src/ephem.js';

const cfg = JSON.parse(readFileSync(new URL('../config/csv.json', import.meta.url), 'utf8'));
const HOUR = 3_600_000;

// 48 hourly rows from 2026-11-01 00:00 UTC; the Sun climbs 0.5° an hour from -6°, Earth sinks 0.25° an hour from 5°.
function table() {
  const n = 48;
  const range = (f) => Array.from({ length: n }, (_, k) => f(k));
  return {
    start: '2026-11-01T00:00Z', step_minutes: 60,
    sun: { az: range((k) => (350 + k * 2) % 360), el: range((k) => -6 + k * 0.5) },
    earth: { az: range(() => 180), el: range((k) => 5 - k * 0.25) },
  };
}

test('hourlyRows: the hours of the period, from the first table hour at or after the card time', () => {
  const rows = hourlyRows({ table: table(), profile: null, fromMs: parseUtc('2026-11-01T05:30'), days: 1 });
  assert.equal(rows.length, 24);
  assert.equal(rows[0].ms, parseUtc('2026-11-01T06:00'));
  assert.equal(rows[23].ms, parseUtc('2026-11-02T05:00'));
  assert.ok(rows.every((r) => r.source === 'horizons' && r.sun.horizon === 0 && r.earth.horizon === 0));
});

test('hourlyRows: the horizon used at each azimuth, and the yes/no from the centre of the disc above it', () => {
  // Skyline 2° toward north and east, 4° toward south and west (90° steps, linear between).
  const profile = { azimuth_step_deg: 90, elev: [2, 2, 4, 4] };
  const rows = hourlyRows({ table: table(), profile, fromMs: parseUtc('2026-11-01T00:00'), days: 2 });
  assert.equal(rows.length, 48);
  for (const r of rows) {
    assert.ok(Math.abs(r.earth.horizon - 4) < 1e-9, 'Earth at azimuth 180° → 4°');
    assert.equal(r.sun.up, r.sun.el - r.sun.horizon > 0);
    assert.equal(r.earth.up, r.earth.el - r.earth.horizon > 0);
  }
  // Earth (5° → -6.75°) is above the 4° skyline only while above 4°: rows 0..3.
  assert.deepEqual(rows.map((r) => r.earth.up).lastIndexOf(true), 3);
});

test('hourlyRows: the yes/no columns count the same hours as the Mission check', () => {
  const tb = table();
  const profile = { azimuth_step_deg: 90, elev: [1, 3, 2, 0] };
  const fromMs = parseUtc('2026-11-01T03:00');
  const rows = hourlyRows({ table: tb, profile, fromMs, days: 1.5 });
  const m = missionMetrics(tb, relativeTable(tb, profile), fromMs, 1.5, { threshold: 0, solar: 1361, sunRadius: 0.267 });
  assert.equal(rows.length, m.rows);
  assert.ok(Math.abs((rows.filter((r) => r.sun.up).length / rows.length) * 100 - m.sunPct) < 1e-9);
  assert.ok(Math.abs((rows.filter((r) => r.earth.up).length / rows.length) * 100 - m.earthPct) < 1e-9);
});

test('hourlyRows: the angle source is asked hour by hour (Horizons rows, then the engine)', () => {
  const frozenEnd = parseUtc('2026-11-01T10:00');
  const rows = hourlyRows({ table: table(), profile: null, fromMs: parseUtc('2026-11-01T08:00'), days: 0.25, sourceAt: (ms) => (ms <= frozenEnd ? 'horizons' : 'engine') });
  assert.deepEqual(rows.map((r) => r.source), ['horizons', 'horizons', 'horizons', 'engine', 'engine', 'engine']);
});

test('csvText: header, one line per hour, CRLF, configured words and decimals', () => {
  const tb = table();
  const rows = hourlyRows({ table: tb, profile: null, fromMs: parseUtc('2026-11-01T00:00'), days: 0.5, sourceAt: (ms) => (ms < parseUtc('2026-11-01T06:00') ? 'horizons' : 'engine') });
  const text = csvText([{ n: 2, site: { name: 'Apollo 15 (Hadley, Apennines)' }, terrain: false, rows }], cfg);
  assert.equal(text.startsWith('﻿'), cfg.bom);
  const lines = text.replace(/^﻿/, '').split('\r\n');
  assert.equal(lines.at(-1), '', 'ends with a line break');
  assert.equal(lines[0], CSV_COLUMNS.join(','));
  assert.equal(lines.length - 2, 12);
  assert.equal(lines[1], `2,"Apollo 15 (Hadley, Apennines)",2026-11-01T00:00Z,350,-6,0,${cfg.no},180,5,0,${cfg.yes},${cfg.horizon.sphere},${cfg.source.horizons}`);
  assert.ok(lines[12].endsWith(`,${cfg.source.engine}`));
  assert.ok(!text.includes('\n\n'));
});

test('csvText: several scenarios follow one another; terrain cards say the LOLA skyline', () => {
  const tb = table();
  const a = hourlyRows({ table: tb, profile: null, fromMs: parseUtc('2026-11-01T00:00'), days: 0.125 });
  const b = hourlyRows({ table: tb, profile: { azimuth_step_deg: 90, elev: [1.234, 1.234, 1.234, 1.234] }, fromMs: parseUtc('2026-11-01T12:00'), days: 0.125 });
  const lines = csvText([{ n: 1, site: { name: 'A' }, terrain: false, rows: a }, { n: 2, site: { name: 'B' }, terrain: true, rows: b }], { ...cfg, bom: false }).split('\r\n');
  assert.equal(lines.length, 1 + 3 + 3 + 1);
  assert.ok(lines[4].startsWith('2,B,2026-11-01T12:00Z,'));
  assert.ok(lines[4].includes(`,1.23,`), 'horizon rounded to the configured decimals');
  assert.ok(lines[4].includes(`,${cfg.horizon.terrain},`));
});

test('csvField: quotes, line breaks and formula-like text are made safe; numbers stay numbers', () => {
  assert.equal(csvField('plain'), 'plain');
  assert.equal(csvField('a,b'), '"a,b"');
  assert.equal(csvField('say "hi"'), '"say ""hi"""');
  assert.equal(csvField('x\ny'), '"x\ny"');
  assert.equal(csvField('=HYPERLINK("x")'), `"'=HYPERLINK(""x"")"`);
  assert.equal(csvField('@cmd'), "'@cmd");
  assert.equal(csvField(-1.5), '-1.5');
  assert.equal(csvField(0), '0');
});

test('csvName: site and date in the name, several cards joined, length capped', () => {
  const ms = parseUtc('2027-03-04T05:06');
  assert.equal(csvName([{ site: { id: 'shackleton-rim' }, ms, days: 7 }], cfg), `${cfg.file_prefix}_shackleton-rim_2027-03-04_7d.csv`);
  const two = csvName([{ site: { id: 'apollo-11' }, ms, days: 29.5 }, { site: { id: 'im-2' }, ms: ms + 30 * 24 * HOUR, days: 7 }], cfg);
  assert.equal(two, `${cfg.file_prefix}_apollo-11_2027-03-04_29-5d_vs_im-2_2027-04-03_7d.csv`);
  const many = csvName(Array.from({ length: 20 }, () => ({ site: { id: 'a-very-long-site-identifier' }, ms, days: 7 })), cfg);
  assert.equal(many.length, cfg.max_name_chars + 4);
  assert.match(many, /^[a-z0-9._-]+\.csv$/);
});

test('siteSlug: own coordinates use the numbers; nothing outside [a-z0-9._-]', () => {
  assert.equal(siteSlug({ custom: true, lat: -89.45, lon_east: 222.5 }), 'custom_-89.45_222.5');
  assert.equal(siteSlug({ id: '../Évil "name"' }), '..-vil-name');
  assert.equal(siteSlug({ id: '' }), 'site');
});
