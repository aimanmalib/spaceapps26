// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// P4q: the Validation page shows the numbers of data/validation.json "pgda_sample" and one dot per point and body.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { makeT } from '../src/i18n.js';
import { sampleHtml, scatterSvg } from '../src/validation-sample.js';

const root = new URL('../', import.meta.url);
const load = (rel) => JSON.parse(readFileSync(new URL(rel, root), 'utf8'));
const s = load('data/validation.json').pgda_sample;
const t = makeT(load('i18n/en.json'));

test('table shows median, 90th percentile, largest difference and the inside-range count from the file', () => {
  const html = sampleHtml(t, s, 'https://pgda.gsfc.nasa.gov/products/69');
  for (const b of ['sun', 'earth']) {
    for (const k of ['median_abs', 'p90_abs', 'max_abs']) assert.ok(html.includes(`<td>${(s[b][k] * 100).toFixed(1)}</td>`), `${b} ${k}`);
    assert.ok(html.includes(`${s[b].within_window} of ${s.count}`), `${b} within`);
  }
  assert.equal((html.match(/<circle /g) || []).length, 2 * s.count);
  assert.ok(!/\{[a-z]+\}/.test(html), 'no unfilled placeholder');
});

test('scatter places a dot at (PGDA, tool) on a 0-100 % square', () => {
  const svg = scatterSvg([{ tool: { sun: 1 }, pgda: { sun: { value: 0 } } }], 'sun', 'x', 240, 34, 16);
  assert.match(svg, /cx="34.0" cy="16.0"/);
});
