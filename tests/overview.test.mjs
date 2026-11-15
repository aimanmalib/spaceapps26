// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// P4s: the one-year overview. Numbers in data/overview.json = a fresh count from the frozen tables = the timeline's
// one-year caption (discShare) = data/validation.json "pgda" for the sites checked against NASA PGDA.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { parseUtc } from '../src/ephem.js';
import { relativeTable, discShare } from '../src/terrain.js';
import { makeT, fill } from '../src/i18n.js';
import { overviewRow, longestRun, sortRows, tableHtml, findings, COLUMNS } from '../src/overview.js';

const json = (p) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), 'utf8'));
const ov = json('data/overview.json');
const sites = json('config/sites.json').sites;
const view = json('config/view.json');
const radius = view.timeline.year.disc_radius_deg;
const t = makeT(json('i18n/en.json'));
const name = (id) => sites.find((s) => s.id === id)?.name ?? id;
const round = (v) => Math.round(v * 1000) / 1000;
const rel = (id) => {
  const h = new URL(`../data/horizon/${id}.json`, import.meta.url);
  return relativeTable(json(`data/ephem/${id}.json`), existsSync(h) ? json(`data/horizon/${id}.json`) : null);
};

test('overview: one row per listed site, horizon = terrain where a LOLA skyline exists', () => {
  assert.deepEqual(ov.sites.map((r) => r.site), sites.map((s) => s.id));
  for (const r of ov.sites) assert.equal(r.horizon, existsSync(new URL(`../data/horizon/${r.site}.json`, import.meta.url)) ? 'terrain' : 'sphere', r.site);
  assert.deepEqual(ov.disc_radius_deg, radius);
});

test('overview: file = a fresh count from data/ephem + data/horizon, and = the one-year caption of the timeline', () => {
  for (const r of ov.sites) {
    const table = rel(r.site);
    const fresh = overviewRow(table, radius, parseUtc(json(`data/ephem/${r.site}.json`).start.replace('Z', '')), round);
    assert.deepEqual({ ...r, site: undefined, horizon: undefined }, { ...fresh, site: undefined, horizon: undefined }, r.site);
    assert.equal(r.sun, round(discShare(table, 'sun', radius.sun)), `${r.site} sun = caption`);
    assert.equal(r.earth, round(discShare(table, 'earth', radius.earth)), `${r.site} earth = caption`);
    assert.ok(r.both <= Math.min(r.sun, r.earth), `${r.site} both ≤ each`);
  }
});

test('overview: IM-1 and IM-2 shares = the values checked against NASA PGDA (data/validation.json)', () => {
  const pgda = json('data/validation.json').pgda.sites;
  for (const id of ['im-1', 'im-2']) {
    const r = ov.sites.find((s) => s.site === id);
    const p = pgda.find((s) => s.site === id);
    assert.equal(r.hours, p.hours);
    assert.equal(r.sun, p.tool.sun, id);
    assert.equal(r.earth, p.tool.earth, id);
  }
});

test('overview: longest run, including runs at the table edges and none at all', () => {
  assert.deepEqual(longestRun([false, true, true, false, true]), { first: 1, last: 2, rows: 2 });
  assert.deepEqual(longestRun([true, true, false, true, true, true]), { first: 3, last: 5, rows: 3 });
  assert.equal(longestRun([false, false]), null);
  const far = ov.sites.find((s) => s.site === 'change-4');
  assert.equal(far.earth, 0);
  assert.equal(far.longest_both, null);
});

test('overview: sorting by every column, both directions, ties by name', () => {
  for (const col of COLUMNS) {
    const asc = sortRows(ov.sites, col, 'asc', name);
    const desc = sortRows(ov.sites, col, 'desc', name);
    assert.equal(asc.length, ov.sites.length);
    if (col === 'both') assert.ok(desc[0].both >= desc[desc.length - 1].both);
  }
  const byName = sortRows(ov.sites, 'name', 'asc', name).map((r) => name(r.site));
  assert.deepEqual(byName, [...byName].sort((a, b) => a.localeCompare(b)));
});

test('overview: table has a row per site, sort buttons with aria-sort, and every value as in the file', () => {
  const html = tableHtml(t, ov, name, { col: 'sun', dir: 'desc' });
  assert.equal((html.match(/<tr><th scope="row">/g) || []).length, ov.sites.length);
  assert.equal((html.match(/class="ov-sort"/g) || []).length, COLUMNS.length);
  assert.equal((html.match(/aria-sort="descending"/g) || []).length, 1);
  for (const r of ov.sites) assert.ok(html.includes(`<td>${(r.sun * 100).toFixed(1)}</td>`), r.site);
  assert.ok(html.includes(t('ov.none')));
});

test('overview: findings name the top sites from the file and use no ranking words', () => {
  const lines = findings(t, ov, name);
  assert.equal(lines.length, 3);
  const top = ov.sites.reduce((a, b) => (b.both > a.both ? b : a));
  assert.ok(lines[1].includes(name(top.site)) && lines[1].includes((top.both * 100).toFixed(1)));
  const run = ov.sites.filter((s) => s.longest_both).reduce((a, b) => (b.longest_both.hours > a.longest_both.hours ? b : a));
  assert.ok(lines[2].includes(name(run.site)) && lines[2].includes((run.longest_both.hours / 24).toFixed(1)));
  for (const l of lines) {
    assert.doesNotMatch(l, /\{|\}/, 'placeholder left');
    assert.doesNotMatch(l, /\b(best|recommend|should|ideal site)\b/i, l);
  }
  assert.ok(fill(t('ov.intro'), { start: 'a', stop: 'b', hours: 1 }).includes('1 hourly steps'));
});

test('overview: README lines and table = the findings and numbers of data/overview.json', () => {
  const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
  for (const l of findings(t, ov, name)) assert.ok(readme.includes(`- ${l}`), l);
  for (const r of ov.sites) {
    const pc = (v) => (v * 100).toFixed(1);
    assert.ok(readme.includes(`| ${name(r.site)} | ${pc(r.sun)} | ${pc(r.earth)} | ${pc(r.both)} |`), r.site);
  }
});
