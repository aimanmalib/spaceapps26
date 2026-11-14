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
