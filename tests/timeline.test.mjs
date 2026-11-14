// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseUtc } from '../src/ephem.js';
import { timelineSpan, rowsIn, shareAbove, timelineSvg } from '../src/timeline.js';

const H = 3600_000;
// Fixed fixture (not project data): hourly rows. Sun up from row 2 to row 4; Earth up everywhere except row 6.
const T = {
  start: '2026-11-14T00:00Z', step_minutes: 60,
  sun: { az: [0, 0, 0, 0, 0, 0, 0, 0], el: [-2, -1, 1, 2, 1, -1, -2, -3] },
  earth: { az: [0, 0, 0, 0, 0, 0, 0, 0], el: [5, 5, 5, 5, 5, 5, -1, 5] },
};
const t0 = parseUtc(T.start);
const range = { startMs: t0, endMs: t0 + 7 * H };

test('a new span is centred on the time and clamped to the table', () => {
  assert.deepEqual(timelineSpan(t0 + 4 * H, null, 2 * H, range), { from: t0 + 3 * H, to: t0 + 5 * H });
  assert.deepEqual(timelineSpan(t0, null, 2 * H, range), { from: t0, to: t0 + 2 * H });
  assert.deepEqual(timelineSpan(t0 + 7 * H, null, 2 * H, range), { from: t0 + 5 * H, to: t0 + 7 * H });
  // Span longer than the table → the whole table.
  assert.deepEqual(timelineSpan(t0 + 3 * H, null, 30 * H, range), { from: t0, to: t0 + 7 * H });
});

test('the span stays put while the time moves inside it, and moves when the time leaves it', () => {
  const cur = { from: t0 + H, to: t0 + 3 * H };
  assert.equal(timelineSpan(t0 + 3 * H, cur, 2 * H, range), cur);
  assert.deepEqual(timelineSpan(t0 + 6 * H, cur, 2 * H, range), { from: t0 + 5 * H, to: t0 + 7 * H });
});

test('rows inside the span and share above the horizon', () => {
  const rows = rowsIn(T, t0 + 1.5 * H, t0 + 6 * H);
  assert.deepEqual(rows.map((r) => (r.ms - t0) / H), [2, 3, 4, 5, 6]);
  assert.equal(shareAbove(rows, 'sun'), 3 / 5);
  assert.equal(shareAbove(rows, 'earth'), 4 / 5);
  assert.equal(shareAbove([], 'sun'), 0);
});

test('svg has one band per run above the horizon and a marker at the chosen time', () => {
  const span = { from: t0, to: t0 + 7 * H };
  const svg = timelineSvg(rowsIn(T, span.from, span.to), span, t0 + 3.5 * H, 10);
  assert.equal((svg.match(/tl-band-sun/g) || []).length, 1);
  assert.equal((svg.match(/tl-band-earth/g) || []).length, 2);
  assert.match(svg, /class="tl-now" x1="180\.0"/);
  assert.match(svg, /aria-hidden="true"/);
});

test('site list is grouped, every site appears once and every group has a label', async () => {
  const { readFileSync } = await import('node:fs');
  const { makeT } = await import('../src/i18n.js');
  const { siteOptions } = await import('../src/compare.js');
  const en = JSON.parse(readFileSync(new URL('../i18n/en.json', import.meta.url), 'utf8'));
  const { sites } = JSON.parse(readFileSync(new URL('../config/sites.json', import.meta.url), 'utf8'));
  const html = siteOptions(makeT(en), sites);
  for (const s of sites) assert.equal(html.split(`value="${s.id}"`).length, 2, s.id);
  for (const g of new Set(sites.map((s) => s.group))) assert.ok(en[`sites.group.${g}`], g);
});

// One-year range (item d): the whole table, lighter lines, and a caption that matches the published H9(b) numbers.
test('thinned lines keep the first and last row; bars still use every row', async () => {
  const { thinRows } = await import('../src/timeline.js');
  const rows = rowsIn(T, t0, t0 + 7 * H);
  assert.deepEqual(thinRows(rows, 3).map((r) => (r.ms - t0) / H), [0, 3, 6, 7]);
  assert.equal(thinRows(rows, 1), rows);
  const span = { from: t0, to: t0 + 7 * H };
  const svg = timelineSvg(rows, span, t0, 10, 0, 3);
  assert.equal(svg.match(/class="tl-line tl-sun" points="([^"]*)"/)[1].split(' ').length, 4);
  assert.equal((svg.match(/tl-band-earth/g) || []).length, 2);
});

test('one year = the whole table (the switch resets the span): span equals the table range', () => {
  assert.deepEqual(timelineSpan(t0 + 2 * H, null, range.endMs - range.startMs, range), { from: t0, to: t0 + 7 * H });
});

test('one-year caption shares equal the tool values in data/validation.json pgda (IM-1, IM-2; ≤ 0.1 point)', async () => {
  const { readFileSync } = await import('node:fs');
  const { relativeTable, discShare } = await import('../src/terrain.js');
  const load = (rel) => JSON.parse(readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8'));
  const year = load('config/view.json').timeline.year;
  assert.deepEqual(year.disc_radius_deg, load('config/pgda.json').disc_radius_deg);
  assert.ok(year.line_every_steps >= 1 && year.play_step_minutes > 0);
  const pgda = load('data/validation.json').pgda;
  for (const id of ['im-1', 'im-2']) {
    const row = pgda.sites.find((s) => s.site === id);
    const table = load(`data/ephem/${id}.json`);
    const rel = relativeTable(table, load(`data/horizon/${id}.json`));
    assert.equal(rel.sun.el.length, row.hours, id);
    for (const b of ['sun', 'earth']) {
      const shown = Number((discShare(rel, b, year.disc_radius_deg[b]) * 100).toFixed(1));
      assert.ok(Math.abs(shown - row.tool[b] * 100) <= 0.1 + 1e-9, `${id} ${b}: ${shown} vs ${row.tool[b] * 100}`);
    }
  }
});
