// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// H9(b): the "pgda" part of data/validation.json follows from today's data and code, and the page shows its numbers.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { visibleShare } from '../src/terrain.js';
import { makeT } from '../src/i18n.js';
import { pgdaHtml } from '../src/validation.js';

const root = new URL('../', import.meta.url);
const load = (rel) => JSON.parse(readFileSync(new URL(rel, root), 'utf8'));
const pgda = load('data/validation.json').pgda;
const cfg = load('config/pgda.json');
const nd = cfg.decimals;
const round = (v) => Math.round(v * 10 ** nd) / 10 ** nd;

test('at least 3 points, every site with a terrain profile included', () => {
  assert.ok(pgda.sites.length >= 3, pgda.sites.length);
  const ids = pgda.sites.map((s) => s.site);
  for (const s of load('config/sites.json').sites) {
    if (existsSync(new URL(`data/horizon/${s.id}.json`, root))) assert.ok(ids.includes(s.id), s.id);
  }
});

test('"this tool" shares equal what src/terrain.js gives from the frozen tables and skylines now', () => {
  for (const s of pgda.sites) {
    const rel = existsSync(new URL(`data/ephem/${s.site}.json`, root)) ? `data/ephem/${s.site}.json` : `data/check/${s.site}.json`;
    const table = load(rel);
    const profile = load(`data/horizon/${s.site}.json`);
    for (const b of ['sun', 'earth']) {
      assert.equal(round(visibleShare(table, profile, b, cfg.disc_radius_deg[b])), s.tool[b], `${s.site} ${b}`);
      assert.ok(Math.abs(round(s.tool[b] - s.pgda[b].value) - s.diff[b]) <= 10 ** -nd, `${s.site} ${b} diff`);
      assert.ok(s.pgda[b].window_min <= s.pgda[b].value && s.pgda[b].value <= s.pgda[b].window_max);
    }
  }
});

test('summary follows from the rows', () => {
  for (const b of ['sun', 'earth']) {
    const d = pgda.sites.map((s) => Math.abs(s.diff[b]));
    assert.equal(pgda[b].max_abs, Math.max(...d));
    assert.ok(Math.abs(pgda[b].mean_abs - d.reduce((a, v) => a + v, 0) / d.length) <= 10 ** -nd);
  }
});

test('Validation page shows the file numbers, unnamed points labelled as not a landing site', () => {
  const t = makeT(load('i18n/en.json'));
  const names = new Map(load('config/sites.json').sites.map((s) => [s.id, s.name]));
  const html = pgdaHtml(t, pgda, (id) => names.get(id), cfg.page_url);
  for (const s of pgda.sites) {
    assert.ok(html.includes(`${(s.tool.sun * 100).toFixed(1)} %`), s.site);
    assert.ok(html.includes(`${(s.pgda.earth.value * 100).toFixed(1)} %`), s.site);
    if (!names.has(s.site)) assert.ok(html.includes('not a landing site'), s.site);
  }
  assert.ok(html.includes(`<dd>${(pgda.sun.max_abs * 100).toFixed(1)}<span class="stat-unit">percentage points</span></dd>`));
  assert.ok(html.includes(cfg.page_url));
});
