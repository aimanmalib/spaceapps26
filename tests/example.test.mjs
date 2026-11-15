// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// "Show me the one-kilometre example" (P4p): one button, one scenario from config/view.json "example". It must be the
// same case as the teachers' page, the README link and the smoke test, and a site with a terrain skyline and nearby
// points, so that the Earth view it scrolls to exists.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { encodeScenarios } from '../src/share.js';

const root = new URL('../', import.meta.url);
const text = (p) => readFileSync(new URL(p, root), 'utf8');
const json = (p) => JSON.parse(text(p));
const view = json('config/view.json');
const en = json('i18n/en.json');

test('example is one listed site and a time on the hourly grid', () => {
  const ex = view.example;
  assert.ok(json('config/sites.json').sites.some((s) => s.id === ex.site));
  assert.match(ex.time_utc, /^\d{4}-\d{2}-\d{2}T\d{2}:00$/);
});

test('example site has a terrain skyline and nearby points (Earth view exists)', () => {
  assert.ok(existsSync(new URL(`data/horizon/${view.example.site}.json`, root)));
  assert.ok(existsSync(new URL(`data/shift/${view.example.site}.json`, root)));
});

test('same case as the teachers page, the README link and the smoke test', () => {
  const km = json('config/teach.json').steps.find((s) => s.key === 'km');
  assert.deepEqual(km.scenarios, [view.example]);
  const q = encodeScenarios([view.example], view.share);
  assert.ok(text('README.md').includes(q), `README links ${q}`);
  assert.ok(text('e2e/smoke.py').includes(`ONE_KM_QUERY = "${q}"`));
});

test('button and status line are on the page, text in i18n', () => {
  const html = text('index.html');
  assert.match(html, /<button type="button" class="btn example" hidden><\/button>/);
  assert.match(html, /class="note example-status" role="status"/);
  assert.equal(typeof en['tool.example'], 'string');
  for (const k of ['{site}', '{time}', '{km}']) assert.ok(en['tool.example_done'].includes(k));
});
