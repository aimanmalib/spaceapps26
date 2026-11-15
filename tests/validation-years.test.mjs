// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Validation page section for dates after the frozen tables (ADR 0104): it shows the numbers of data/validation-years.json.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { makeT } from '../src/i18n.js';
import { yearsHtml } from '../src/validation-years.js';

const root = new URL('../', import.meta.url);
const load = (rel) => JSON.parse(readFileSync(new URL(rel, root), 'utf8'));
const y = load('data/validation-years.json');
const d = load('config/validation.json').decimals_report;

test('later years: the page gives the pairs, the largest difference and the same-answer counts of the file', () => {
  const html = yearsHtml(makeT(load('i18n/en.json')), y, d);
  const s = y.summary;
  assert.equal(y.to, '2041-01-01 00:00');
  assert.ok(html.includes(`at ${y.pairs.length} random site-and-minute pairs in ${y.from.slice(0, 4)} to 2040`));
  assert.ok(html.includes(`largest difference ${s.max_abs_deg.toFixed(d)}°`));
  assert.ok(html.includes(`same solar power answer ${s.same_answer.power} of ${s.same_answer.of}`));
  for (const q of Object.values(s.by_quantity)) assert.ok(html.includes(`<td>${q.max_abs_deg.toFixed(d)}°</td><td>${q.mean_abs_deg.toFixed(d)}°</td>`));
  assert.ok(!/[{}]/.test(html));
  // "validated" on the cards is tied to this result (config/years.json check.max_diff_deg).
  assert.equal(y.passed, s.max_abs_deg <= y.max_diff_deg && s.same_answer.power === s.same_answer.of && s.same_answer.comm === s.same_answer.of);
});
