// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Guided tour (ADR 0110): four or five steps from config/tour.json, each with its title and text in every language.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), 'utf8'));
const cfg = read('config/tour.json');

test('tour: four or five steps, unique ids, a target for each', () => {
  assert.ok(cfg.steps.length >= 4 && cfg.steps.length <= 5);
  assert.equal(new Set(cfg.steps.map((s) => s.id)).size, cfg.steps.length);
  for (const s of cfg.steps) assert.ok(typeof s.target === 'string' && s.target.trim(), s.id);
});

test('tour: every step and button has its text in en, id and ms', () => {
  const keys = ['tour.start', 'tour.step', 'tour.back', 'tour.next', 'tour.done', 'tour.close', 'tour.close_short',
    ...cfg.steps.flatMap((s) => [`tour.${s.id}.title`, `tour.${s.id}.text`])];
  for (const lang of ['en', 'id', 'ms']) {
    const dict = read(`i18n/${lang}.json`);
    assert.deepEqual(keys.filter((k) => !dict[k]?.trim()), [], lang);
  }
});

test('tour: the step counter fills both numbers', () => {
  for (const lang of ['en', 'id', 'ms']) {
    const s = read(`i18n/${lang}.json`)['tour.step'];
    assert.ok(s.includes('{n}') && s.includes('{total}'), lang);
  }
});
