// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Later dates (ADR 0104): which table a time uses, the Horizons/engine seam, and the blocks that read the table
// (timeline, "If the date moves", "Next windows") running on past the frozen tables' end.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseUtc, tableRange, sampleAt } from '../src/ephem.js';
import { computeTable } from '../src/moonsky.js';
import { yearsRange, spanFor, mergeTables, makeYears, sourceAt, checkPassed, sourceKey, sourceHtml } from '../src/years.js';
import { windowAt } from '../src/windows.js';
import { dateRows } from '../src/sequence.js';
import { findWindows } from '../src/mission.js';
import { timelineSpan, rowsIn } from '../src/timeline.js';
import { makeT } from '../src/i18n.js';

const root = new URL('../', import.meta.url);
const json = (rel) => JSON.parse(readFileSync(new URL(rel, root), 'utf8'));
const eph = json('config/ephemeris.json');
const cfg = json('config/years.json');
const custom = json('config/custom.json');
const range = yearsRange(eph, cfg);
const H = 3600_000;
const DAY = 24 * H;

// Engine provider as in the page, but in this thread (the page uses a Web Worker).
const engine = async (site, span) =>
  computeTable(site, { startMs: span.startMs, endMs: span.endMs, stepMinutes: eph.step_minutes, radiusKm: custom.moon_radius_km, decimals: custom.decimals });
const frozen = async (id) => json(`data/ephem/${id}.json`);
const siteById = new Map(json('config/sites.json').sites.map((s) => [s.id, s]));

test('config: dates run to the end of 2030 and the check covers 2028 to 2030 with at least 20 pairs', () => {
  assert.equal(range.endMs, Date.UTC(2031, 0, 1));
  assert.ok(range.frozenEndMs < Date.UTC(2028, 0, 1));
  assert.ok(cfg.check.pairs >= 20);
  assert.equal(cfg.check.from, '2028-01-01 00:00');
  assert.equal(cfg.check.to, '2031-01-01 00:00');
  assert.ok(cfg.check.max_diff_deg <= 0.05);
});

test('spanFor: frozen table inside its range, padded engine blocks after it, nothing outside the dates', () => {
  assert.equal(spanFor(parseUtc('2027-03-01 00:00'), range, cfg), null);
  assert.equal(spanFor(range.startMs - H, range, cfg), null);
  assert.equal(spanFor(range.endMs + H, range, cfg), null);
  const pad = cfg.pad_days * DAY;
  // Close to the frozen end: first block, so the rows after the card's time continue past it.
  const near = spanFor(range.frozenEndMs - DAY, range, cfg);
  assert.deepEqual(near, { startMs: range.frozenEndMs - pad, endMs: range.frozenEndMs + (cfg.chunk_days + cfg.pad_days) * DAY });
  // Every accepted time past the frozen end lies inside its block, with pad_days after it unless the dates end first.
  for (let ms = range.frozenEndMs - pad + H; ms <= range.endMs; ms += 7 * DAY + 5 * H) {
    const s = spanFor(ms, range, cfg);
    assert.ok(s && s.startMs <= ms && ms <= s.endMs, new Date(ms).toISOString());
    assert.ok(s.endMs >= Math.min(range.endMs, ms + pad));
    assert.equal((s.startMs - range.startMs) % range.stepMs, 0);
  }
  const last = spanFor(range.endMs, range, cfg);
  assert.equal(last.endMs, range.endMs);
});

test('sourceAt and the card label: Horizons inside the frozen range, engine after it and for own coordinates', () => {
  const site = { id: 'im-2' };
  assert.equal(sourceAt(site, range.frozenEndMs, range), 'horizons');
  assert.equal(sourceAt(site, range.frozenEndMs + 1, range), 'engine');
  assert.equal(sourceAt({ custom: true }, range.startMs, range), 'engine');
  assert.equal(sourceKey('horizons', false, false), 'years.source.horizons');
  assert.equal(sourceKey('engine', true, true), 'years.source.engine');
  assert.equal(sourceKey('engine', true, false), 'years.source.engine_unchecked');
  assert.equal(sourceKey('engine', false, false), 'years.source.engine');
  const t = makeT(json('i18n/en.json'));
  assert.match(sourceHtml(t, 'horizons', false, true), /JPL Horizons table/);
  assert.match(sourceHtml(t, 'engine', true, true), /in-browser engine, validated against JPL Horizons/);
  assert.match(sourceHtml(t, 'engine', true, false), /Not validated against/);
});

test('checkPassed needs every difference within the limit and every answer the same', () => {
  const ok = { max_abs_deg: 0.01, same_answer: { power: 24, comm: 24, of: 24 } };
  assert.equal(checkPassed(ok, 0.05), true);
  assert.equal(checkPassed({ ...ok, max_abs_deg: 0.06 }, 0.05), false);
  assert.equal(checkPassed({ ...ok, same_answer: { power: 23, comm: 24, of: 24 } }, 0.05), false);
  assert.equal(checkPassed(null, 0.05), false);
});

test('the page label follows the recorded check (data/validation-years.json)', () => {
  const v = json('data/validation-years.json');
  assert.equal(checkPassed(v.summary, cfg.check.max_diff_deg), v.passed);
  assert.ok(v.pairs.length >= 20);
});

test('mergeTables keeps the Horizons rows up to the frozen end and the engine rows after it', () => {
  const f = { site: 'x', start: '2027-10-31T22:00Z', step_minutes: 60, sun: { az: [1, 2, 3], el: [10, 20, 30] }, earth: { az: [4, 5, 6], el: [40, 50, 60] } };
  const r = { startMs: parseUtc('2026-11-01 00:00'), frozenEndMs: parseUtc('2027-11-01 00:00'), stepMs: H };
  const e = { start: '2027-11-01T01:00Z', step_minutes: 60, sun: { az: [7, 8], el: [70, 80] }, earth: { az: [9, 9], el: [90, 91] } };
  const span = { startMs: parseUtc('2027-10-31 23:00'), endMs: parseUtc('2027-11-01 02:00') };
  const m = mergeTables(f, e, span, r);
  assert.equal(m.start, '2027-10-31T23:00Z');
  assert.deepEqual(m.sun.el, [20, 30, 70, 80]);
  assert.deepEqual(m.earth.az, [5, 6, 9, 9]);
  assert.equal(m.engine_from, '2027-11-01T01:00Z');
  assert.equal(m.site, 'x');
});

test('a listed site past 2027-11-01: card sample, timeline, "If the date moves" and "Next windows" all have rows', async () => {
  const years = makeYears({ eph, cfg: { ...cfg, cache_tables: 4 }, frozen, engine });
  const site = siteById.get('im-2');
  const ms = parseUtc('2029-06-15 12:00');
  const table = await years.table(site, ms);
  const { startMs, endMs } = tableRange(table);
  assert.ok(startMs <= ms && ms + cfg.pad_days * DAY <= endMs);
  const sample = sampleAt(table, ms);
  assert.ok(sample && Number.isFinite(sample.sun.el) && Number.isFinite(sample.earth.az));
  // Same angles as the engine asked for that minute alone (only the block is new, not the numbers).
  const one = await engine({ lat: table.lat, lon_east: table.lon_east }, { startMs: ms - 12 * H, endMs: ms + 12 * H });
  const ref = sampleAt(one, ms);
  assert.ok(Math.abs(ref.sun.el - sample.sun.el) < 1e-9);
  // Timeline (one lunar day), "If the date moves" (14 rows a day apart), "Next windows".
  const span = timelineSpan(ms, null, 29.53 * DAY, tableRange(table));
  assert.ok(rowsIn(table, span.from, span.to).length > 700);
  const rows = dateRows(table, null, sample, ms, 14, 24, 0);
  assert.equal(rows.length, 15);
  assert.ok(rows.every((r) => r.answers), 'every row inside the table');
  const w = windowAt(table, ms, 'sun', sample.sun.el > 0);
  assert.ok(w.none || (w.start !== null && w.end > w.start));
  assert.ok(Array.isArray(findWindows(table, ms, 24, 0, 5)));
});

test('the seam at the frozen end is continuous (Horizons row, then engine rows a step later)', async () => {
  const years = makeYears({ eph, cfg: { ...cfg, cache_tables: 4 }, frozen, engine });
  const ms = range.frozenEndMs - 2 * DAY;
  const table = await years.table(siteById.get('shackleton-ridge'), ms);
  const i = Math.round((range.frozenEndMs - parseUtc(table.start)) / range.stepMs);
  const f = json('data/ephem/shackleton-ridge.json');
  assert.equal(table.sun.el[i], f.sun.el[f.sun.el.length - 1]);
  // One hour later the engine row: the Sun moves well under a degree per hour at the pole.
  for (const b of ['sun', 'earth']) assert.ok(Math.abs(table[b].el[i + 1] - table[b].el[i]) < 1, b);
  // "If the date moves" from two days before the end reads rows after it.
  const sample = sampleAt(table, ms);
  assert.ok(dateRows(table, null, sample, ms, 14, 24, 0).every((r) => r.answers));
  assert.ok(sampleAt(table, ms + 14 * DAY));
});

test('own coordinates and nearby points get blocks past the frozen end too', async () => {
  const calls = [];
  const years = makeYears({ eph, cfg, frozen, engine: async (site, span) => (calls.push(span), span) });
  await years.table({ custom: true, lat: 1, lon_east: 2 }, parseUtc('2026-12-01 00:00'));
  assert.deepEqual(calls.pop(), { startMs: range.startMs, endMs: range.frozenEndMs });
  await years.engineAt({ lat: 1, lon_east: 2 }, parseUtc('2030-12-31 23:00'));
  assert.equal(calls.pop().endMs, range.endMs);
});
