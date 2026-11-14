// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// H9(a): data/validation.json exists, matches what the page code shows today, and the Validation page shows the file's numbers.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseUtc, sampleAt } from '../src/ephem.js';
import { makeT } from '../src/i18n.js';
import { validationHtml } from '../src/validation.js';

const root = new URL('../', import.meta.url);
const load = (rel) => JSON.parse(readFileSync(new URL(rel, root), 'utf8'));
const data = load('data/validation.json');
const vcfg = load('config/validation.json');
const eph = load('config/ephemeris.json');
const pairs = data.horizons.pairs;
const nd = vcfg.decimals_report;
const round = (v) => Math.round(v * 10 ** nd) / 10 ** nd;

test('at least 20 pairs, none on a table row, every site covered', () => {
  assert.ok(pairs.length >= 20, pairs.length);
  const sites = load('config/sites.json').sites.map((s) => s.id);
  assert.deepEqual([...new Set(pairs.map((p) => p.site))].sort(), [...sites].sort());
  const start = parseUtc(eph.start);
  for (const p of pairs) assert.notEqual(((parseUtc(p.time_utc) - start) / 60_000) % eph.step_minutes, 0, p.time_utc);
});

test('"shown" angles in the file equal what src/ephem.js gives from the frozen tables now', () => {
  for (const p of pairs) {
    const s = sampleAt(load(`data/ephem/${p.site}.json`), parseUtc(p.time_utc));
    assert.ok(s, `${p.site} ${p.time_utc}`);
    for (const b of ['sun', 'earth']) for (const k of ['az', 'el']) {
      assert.ok(Math.abs(round(s[b][k]) - p.shown[b][k]) <= 10 ** -nd, `${p.site} ${p.time_utc} ${b}.${k}`);
    }
  }
});

test('summary numbers follow from the pairs', () => {
  const h = data.horizons;
  const absAll = pairs.flatMap((p) => ['sun', 'earth'].flatMap((b) => ['az', 'el'].map((k) => Math.abs(p.diff[b][k]))));
  assert.equal(h.max_abs_deg, Math.max(...absAll));
  for (const [q, s] of Object.entries(h.by_quantity)) {
    const [b, k] = q.split('_');
    const v = pairs.map((p) => Math.abs(p.diff[b][k]));
    assert.equal(s.max_abs_deg, Math.max(...v), q);
    assert.ok(Math.abs(s.mean_abs_deg - v.reduce((a, c) => a + c, 0) / v.length) <= 10 ** -nd, q);
  }
  for (const p of pairs) {
    const az = (((p.shown.sun.az - p.horizons.sun.az) % 360) + 540) % 360 - 180;
    assert.ok(Math.abs(round(az) - p.diff.sun.az) <= 2 * 10 ** -nd, `${p.site} ${p.time_utc} sun.az`);
    assert.ok(Math.abs(round(p.shown.earth.el - p.horizons.earth.el) - p.diff.earth.el) <= 2 * 10 ** -nd);
  }
  assert.equal(h.same_answer.of, pairs.length);
});

test('the Validation page shows the numbers from the file', () => {
  const t = makeT(load('i18n/en.json'));
  const html = validationHtml(t, data, (id) => id, nd);
  const h = data.horizons;
  assert.ok(html.includes(`${h.max_abs_deg.toFixed(nd)}°`));
  assert.ok(html.includes(`${h.mean_abs_deg.toFixed(nd)}°`));
  assert.ok(html.includes(`${h.same_answer.power} of ${h.same_answer.of}`));
  assert.equal((html.match(/<tr>/g) || []).length, pairs.length + 4 + 2);
  for (const p of pairs) assert.ok(html.includes(`${p.horizons.sun.el.toFixed(nd)}°`), p.time_utc);
});
