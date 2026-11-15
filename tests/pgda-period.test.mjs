// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Same-period PGDA check and ridge-point sensitivity (data/validation.json "pgda_period", scripts/pgda_period.py):
// the block follows from the "pgda" block and its own rows, and the Validation page and the home line show its numbers.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { makeT } from '../src/i18n.js';
import { periodHtml, ridgeFacts } from '../src/validation-period.js';
import { trustText } from '../src/trust.js';

const root = new URL('../', import.meta.url);
const load = (rel) => JSON.parse(readFileSync(new URL(rel, root), 'utf8'));
const data = load('data/validation.json');
const pp = data.pgda_period;
const cfg = load('config/pgda.json');
const nd = cfg.decimals;
const round = (v) => Math.round(v * 10 ** nd) / 10 ** nd;
const t = makeT(load('i18n/en.json'));
const names = new Map(load('config/sites.json').sites.map((s) => [s.id, s.name]));

test('same-period block: same points and PGDA values as the one-year check, differences follow from the rows', () => {
  assert.deepEqual(pp.sites.map((s) => s.site), data.pgda.sites.map((s) => s.site));
  assert.equal(pp.period.years, cfg.period.years);
  assert.equal(pp.period.hours, Math.round(cfg.period.years * 365.25 * 24));
  for (const [i, s] of pp.sites.entries()) {
    for (const b of ['sun', 'earth']) {
      assert.equal(s.pgda[b], data.pgda.sites[i].pgda[b].value, `${s.site} ${b}`);
      assert.ok(Math.abs(round(s.tool[b] - s.pgda[b]) - s.diff[b]) <= 10 ** -nd, `${s.site} ${b} diff`);
      assert.ok(s.one_year[b].min <= s.one_year[b].max && s.one_year[b].min >= 0 && s.one_year[b].max <= 1);
    }
    assert.ok(s.calendar_years >= 17, s.site);
  }
  for (const b of ['sun', 'earth']) assert.equal(pp[b].max_abs, Math.max(...pp.sites.map((s) => Math.abs(s.diff[b]))));
  const listed = pp.sites.filter((s) => names.has(s.site));
  assert.deepEqual(pp.landing_sites.ids, ['im-1', 'im-2']);
  assert.equal(pp.landing_sites.max_abs, Math.max(...listed.flatMap((s) => [Math.abs(s.diff.sun), Math.abs(s.diff.earth)])));
});

test('ridge point: observer heights and the 3 x 3 block as configured; the usual height reproduces the published skyline', () => {
  const r = pp.ridge;
  assert.equal(r.site, cfg.period.ridge.point);
  assert.deepEqual(r.observer.map((o) => o.height_m), cfg.period.ridge.observer_heights_m);
  assert.equal(r.block.points.length, 9);
  assert.equal(r.block.offset_m, cfg.period.ridge.block_offset_m);
  const { row, high } = ridgeFacts(pp);
  const centre = r.block.points.find((p) => p.dx_m === 0 && p.dy_m === 0);
  for (const b of ['sun', 'earth']) {
    assert.equal(high[b], row.tool[b], `observer ${high.height_m} m = published skyline (${b})`);
    assert.equal(centre[b], row.tool[b], `block centre = published skyline (${b})`);
    assert.equal(r.block[b].min, Math.min(...r.block.points.map((p) => p[b])));
    assert.equal(r.block[b].max, Math.max(...r.block.points.map((p) => p[b])));
  }
  for (const o of r.observer) assert.ok(o.near >= 0 && o.near <= r.azimuths);
});

test('Validation page shows the same-period numbers; "between" is said only when the data says so', () => {
  const html = periodHtml(t, pp, (id) => names.get(id), cfg.page_url);
  const pct = (v) => `${(v * 100).toFixed(1)} %`;
  for (const s of pp.sites) {
    assert.ok(html.includes(`<td>${pct(s.tool.sun)}</td><td>${pct(s.pgda.sun)}</td><td>${pct(s.tool.earth)}</td><td>${pct(s.pgda.earth)}</td>`), s.site);
    assert.ok(html.includes(`${pct(s.one_year.sun.min)} – ${pct(s.one_year.sun.max)}`), s.site);
  }
  const { row, low, high, between } = ridgeFacts(pp);
  assert.ok(html.includes(`still differs by ${(Math.abs(row.diff.sun) * 100).toFixed(1)} percentage points`));
  assert.ok(html.includes(`this tool gives ${(low.sun * 100).toFixed(1)} % for the Sun; at ${high.height_m} m`));
  assert.ok(html.includes(`${(pp.ridge.block.sun.min * 100).toFixed(1)} % to ${(pp.ridge.block.sun.max * 100).toFixed(1)} %`));
  assert.ok(html.includes(`in ${high.near} of ${pp.ridge.azimuths} directions`));
  assert.equal(html.includes('lies between the two observer heights'), between);
  assert.ok(html.includes('not a landing site') && html.includes(cfg.page_url));
  assert.ok(!/[{}]/.test(html));
});

test('home line: the same-period number at the landing sites, and it says a ridge test point differs more', () => {
  const text = trustText(t, data, 4);
  assert.ok(text.includes(`maps, same ${pp.period.years} years: within ${(pp.landing_sites.max_abs * 100).toFixed(1)} percentage points at IM-1 and IM-2`));
  assert.ok(text.includes('a ridge test point differs more'));
  assert.ok(!text.includes((data.pgda.sun.max_abs * 100).toFixed(1)) && !text.includes((pp.sun.max_abs * 100).toFixed(1)));
});
