// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Check at scale (ADR 0108): data/validation-scale.json covers every listed site over the frozen tables and the engine
// dates, its "shown" angles are what the page code gives today, the summary in data/validation.json follows from the
// pairs, every Horizons check together (all_checks) follows from the files, and the page and first-screen line show it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { parseUtc } from '../src/ephem.js';
import { makeT } from '../src/i18n.js';
import { scaleHtml } from '../src/validation-scale.js';
import { trustText } from '../src/trust.js';

const root = new URL('../', import.meta.url);
const load = (rel) => JSON.parse(readFileSync(new URL(rel, root), 'utf8'));
const v = load('data/validation.json');
const s = v.scale;
const file = load('data/validation-scale.json');
const pairs = file.pairs;
const cfg = load('config/validation.json').scale;
const eph = load('config/ephemeris.json');
const sites = load('config/sites.json').sites;
const threshold = load('config/view.json').horizon_threshold_deg;
const nd = load('config/validation.json').decimals_report;
const round = (x) => Math.round(x * 10 ** nd) / 10 ** nd;
const QS = [['sun', 'az'], ['sun', 'el'], ['earth', 'az'], ['earth', 'el']];
const frozenEnd = parseUtc(eph.stop);

test('at least 500 pairs, every listed site, both sources, never on a table hour, inside from..to', () => {
  assert.ok(pairs.length >= 500, pairs.length);
  assert.equal(pairs.length, sites.length * cfg.pairs_per_site);
  for (const site of sites) assert.equal(pairs.filter((p) => p.site === site.id).length, cfg.pairs_per_site, site.id);
  for (const p of pairs) {
    const ms = parseUtc(p.time_utc);
    assert.ok(ms > parseUtc(cfg.from) && ms < parseUtc(cfg.to), p.time_utc);
    assert.notEqual(p.time_utc.slice(-2), '00', p.time_utc);
    assert.equal(p.source, ms <= frozenEnd ? 'table' : 'engine', p.time_utc);
  }
  assert.ok(s.by_source.table.same_answer.of > 0 && s.by_source.engine.same_answer.of > 0);
  assert.equal(new Set(pairs.map((p) => p.time_utc.slice(0, 4))).size, 5, 'pairs in each year 2026 to 2030');
});

test('"shown" angles are what the page code gives today (frozen table up to its end, engine after it)', () => {
  for (const [source, script] of [['table', 'scripts/shown_angles.mjs'], ['engine', 'scripts/engine_angles.mjs']]) {
    const sub = pairs.filter((p) => p.source === source);
    const out = JSON.parse(execFileSync(process.execPath, [new URL(script, root).pathname], { input: JSON.stringify(sub), maxBuffer: 1 << 26 }));
    sub.forEach((p, i) => {
      // 1.5 units: Python's round() and Math.round can differ by one unit on a tie.
      for (const [b, k] of QS) assert.ok(Math.abs(round(out[i][b][k]) - p.shown[b][k]) <= 1.5 * 10 ** -nd, `${p.site} ${p.time_utc} ${b}.${k}`);
    });
  }
});

const absDiff = (rows, b, k) => rows.map((p) => Math.abs(p.diff[b][k]));
const same = (rows, b) => rows.filter((p) => (p.shown[b].el > threshold) === (p.horizons[b].el > threshold)).length;

function checkSummary(sum, rows, label) {
  const all = QS.flatMap(([b, k]) => absDiff(rows, b, k));
  assert.equal(sum.max_abs_deg, Math.max(...all), label);
  for (const [b, k] of QS) {
    const vals = absDiff(rows, b, k);
    assert.equal(sum.by_quantity[`${b}_${k}`].max_abs_deg, Math.max(...vals), `${label} ${b}_${k}`);
    assert.ok(Math.abs(sum.by_quantity[`${b}_${k}`].mean_abs_deg - vals.reduce((a, c) => a + c, 0) / vals.length) <= 10 ** -nd);
  }
  assert.deepEqual(sum.same_answer, { power: same(rows, 'sun'), comm: same(rows, 'earth'), of: rows.length }, label);
}

test('summary in data/validation.json follows from the pairs; answers that differ are listed, not dropped', () => {
  for (const p of pairs) {
    for (const [b, k] of QS) {
      const d = k === 'az' ? ((((p.shown[b].az - p.horizons[b].az) % 360) + 540) % 360) - 180 : p.shown[b].el - p.horizons[b].el;
      assert.ok(Math.abs(round(d) - p.diff[b][k]) <= 2 * 10 ** -nd, `${p.site} ${p.time_utc} ${b}.${k}`);
    }
  }
  checkSummary(s, pairs, 'scale');
  checkSummary(file.summary, pairs, 'file');
  for (const src of ['table', 'engine']) checkSummary(s.by_source[src], pairs.filter((p) => p.source === src), src);
  const differ = pairs.flatMap((p) => [['power', 'sun'], ['comm', 'earth']]
    .filter(([, b]) => (p.shown[b].el > threshold) !== (p.horizons[b].el > threshold)).map(([answer]) => `${p.site} ${p.time_utc} ${answer}`));
  assert.deepEqual(s.different_answers.map((x) => `${x.site} ${x.time_utc} ${x.answer}`), differ);
  assert.equal(s.different_answers.length, 2 * pairs.length - s.same_answer.power - s.same_answer.comm);
  assert.deepEqual({ ...s, file: undefined, all_checks: undefined }, { ...file.summary, ...Object.fromEntries(Object.entries(file).filter(([k]) => !['summary', 'pairs'].includes(k))), file: undefined, all_checks: undefined });
});

test('all_checks = every Horizons check of the project together, each site-and-minute pair once', () => {
  const listed = new Set(sites.map((x) => x.id));
  const parts = {
    table_70: v.horizons.pairs,
    engine_points: v.engine.pairs.filter((p) => !listed.has(p.site)),
    later_years: load('data/validation-years.json').pairs,
    scale: pairs,
  };
  const rows = Object.values(parts).flat();
  const a = s.all_checks;
  assert.deepEqual(a.parts, Object.fromEntries(Object.entries(parts).map(([k, p]) => [k, p.length])));
  assert.equal(a.pairs, rows.length);
  assert.equal(a.angles, 4 * rows.length);
  assert.equal(new Set(rows.map((p) => `${p.site} ${p.time_utc}`)).size, rows.length, 'no pair counted twice');
  checkSummary(a, rows, 'all_checks');
  assert.equal(a.different, 2 * rows.length - a.same_answer.power - a.same_answer.comm);
});

test('the Validation page and the first-screen line show the numbers from the files', () => {
  for (const lang of ['en', 'ms', 'id']) {
    const t = makeT(load(`i18n/${lang}.json`));
    const html = scaleHtml(t, s, pairs, (id) => id, nd);
    assert.ok(!/[{}]/.test(html.replace(/<[^>]+>/g, '')), lang);
    assert.ok(html.includes(`${s.max_abs_deg.toFixed(nd)}°`) && html.includes(`${s.sky_separation.sun.max_deg.toFixed(nd)}°`), lang);
    assert.ok(html.includes(`${s.all_checks.pairs}`) && html.includes(`${s.all_checks.angles}`), lang);
    assert.equal((html.match(/<tr>/g) || []).length, pairs.length + 1 + 4 + 1 + 2 + 1 + s.different_answers.length + (s.different_answers.length ? 1 : 0), lang);
  }
  const t = makeT(load('i18n/en.json'));
  const html = scaleHtml(t, s, pairs, (id) => id, nd);
  assert.ok(html.includes(`${s.same_answer.power} of ${s.same_answer.of}`));
  assert.ok(html.includes(`${s.all_checks.same_answer.comm} of ${s.all_checks.same_answer.of}`));
  const line = trustText(t, v, nd);
  assert.ok(line.includes(`at ${s.all_checks.same_answer.of} random times`), line);
  assert.ok(line.includes(`${s.all_checks.max_abs_deg.toFixed(nd)}°`), line);
  assert.ok(line.includes(`answer ${s.all_checks.same_answer.power} of ${s.all_checks.same_answer.of}`), line);
});
