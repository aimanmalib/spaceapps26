// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Terrain range (ADR 0041): data/band/<site>.json brackets the published skyline, its one-year shares bracket the
// site's own, and the card marks an answer only when it changes between the lowest and the highest skyline.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { makeT } from '../src/i18n.js';
import { sampleAt, parseUtc } from '../src/ephem.js';
import { judge } from '../src/shifts.js';
import { centreShare } from '../src/disc.js';
import { visibleShare } from '../src/terrain.js';
import { bandJudge, bandKey, bandHtml } from '../src/band.js';
import { resultHtml } from '../src/result.js';
import { scenarioFacts } from '../src/facts.js';
import { relativeTable } from '../src/terrain.js';
import { discState, discRadii } from '../src/disc.js';

const root = new URL('../', import.meta.url);
const load = (rel) => JSON.parse(readFileSync(new URL(rel, root), 'utf8'));
const view = load('config/view.json');
const cfg = load('config/band.json');
const en = load('i18n/en.json');
const t = makeT(en);
const ids = readdirSync(new URL('data/band/', root)).filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', '')).sort();
const round = (v) => Math.round(v * 1000) / 1000;

test('every site with a skyline has a range file; it brackets the published skyline at every azimuth', () => {
  const terrain = readdirSync(new URL('data/horizon/', root)).map((f) => f.replace('.json', '')).filter((id) => load('config/sites.json').sites.some((s) => s.id === id)).sort();
  assert.deepEqual(ids, terrain);
  for (const id of ids) {
    const band = load(`data/band/${id}.json`);
    const sky = load(`data/horizon/${id}.json`);
    assert.equal(band.offset_m, cfg.offset_m);
    assert.deepEqual(band.observer_heights_m, cfg.observer_heights_m);
    assert.equal(band.variants, 9 * cfg.observer_heights_m.length);
    assert.equal(band.points.length, band.variants);
    assert.equal(band.lo.length, sky.elev.length);
    assert.equal(band.hi.length, sky.elev.length);
    for (let i = 0; i < sky.elev.length; i += 1) assert.ok(band.lo[i] <= sky.elev[i] && sky.elev[i] <= band.hi[i], `${id} azimuth ${i}`);
  }
});

test('one-year shares: the site value is the page rule on the published skyline, inside the lowest and highest of the range', () => {
  for (const id of ids) {
    const band = load(`data/band/${id}.json`);
    const table = load(`data/ephem/${id}.json`);
    const sky = load(`data/horizon/${id}.json`);
    const radius = view.timeline.year.disc_radius_deg;
    for (const b of ['sun', 'earth']) {
      const c = band.year.centre[b];
      const d = band.year.disc[b];
      assert.equal(c.site, round(centreShare(table, sky, b, view.horizon_threshold_deg)), `${id} ${b} centre`);
      assert.equal(d.site, round(visibleShare(table, sky, b, radius[b])), `${id} ${b} disc`);
      for (const r of [c, d]) assert.ok(r.min <= r.site && r.site <= r.max, `${id} ${b}`);
      assert.equal(c.min, Math.min(...band.points.map((p) => p.centre[b])));
      assert.equal(c.max, Math.max(...band.points.map((p) => p.centre[b])));
    }
    assert.equal(band.year.hours, table.sun.el.length);
    // Share of hours in which an answer changes inside the range: the page rule over every table row.
    const n = table.sun.el.length;
    const count = { sun: 0, earth: 0 };
    for (let k = 0; k < n; k += 1) {
      const j = bandJudge({ sun: { az: table.sun.az[k], el: table.sun.el[k] }, earth: { az: table.earth.az[k], el: table.earth.el[k] } }, band, view.horizon_threshold_deg);
      for (const b of ['sun', 'earth']) if (j[b].flip) count[b] += 1;
    }
    for (const b of ['sun', 'earth']) assert.equal(band.year.changes[b], round(count[b] / n), `${id} ${b} changes`);
  }
});

test('an answer is marked only when it differs between the lowest and the highest skyline', () => {
  const band = { azimuth_step_deg: 90, lo: [1, 1, 1, 1], hi: [3, 3, 3, 3] };
  const at = (sunEl, earthEl) => bandJudge({ sun: { az: 10, el: sunEl }, earth: { az: 200, el: earthEl } }, band, 0);
  assert.equal(bandKey(at(5, 0)), 'hold'); // above the highest; below the lowest
  assert.equal(bandKey(at(2, 0)), 'sun');
  assert.equal(bandKey(at(5, 2.5)), 'earth');
  assert.equal(bandKey(at(1.5, 3)), 'both'); // exactly on the highest skyline is not above it
  const j = at(2, 0);
  assert.deepEqual([j.sun.upLow, j.sun.upHigh, j.sun.flip], [true, false, true]);
  assert.deepEqual([j.earth.upLow, j.earth.upHigh, j.earth.flip], [false, false, false]);
});

test('card: the range row sits inside the answers list after the two answers, with the file numbers; none without a range', () => {
  for (const id of ids) {
    const band = load(`data/band/${id}.json`);
    const table = load(`data/ephem/${id}.json`);
    const profile = load(`data/horizon/${id}.json`);
    const ms = parseUtc('2026-11-14T00:00');
    const sample = sampleAt(table, ms);
    const j = judge(sample, profile, view.horizon_threshold_deg);
    const up = { sun: j.sun.up, earth: j.earth.up };
    const radii = discRadii(view);
    const r = { site: load('config/sites.json').sites.find((s) => s.id === id), sample, up, profile, scale: 10,
      disc: { sun: discState(j.sun.margin, radii.sun), earth: discState(j.earth.margin, radii.earth) },
      facts: scenarioFacts(t, relativeTable(table, profile), ms, { sample, up, margin: { sun: j.sun.margin, earth: j.earth.margin } }, view) };
    const range = { band, judge: bandJudge(sample, band, view.horizon_threshold_deg) };
    const html = resultHtml(t, { ...r, range }, view);
    const row = bandHtml(t, band, range.judge);
    assert.ok(html.includes(`${row}</ul>`), id);
    assert.equal((html.match(/<li class="answer /g) || []).length, 2);
    const y = band.year.centre;
    assert.ok(row.includes(`${(y.earth.site * 100).toFixed(1)} % (${(y.earth.min * 100).toFixed(1)} % to ${(y.earth.max * 100).toFixed(1)} %)`), id);
    assert.ok(row.includes(en[`band.${bandKey(range.judge)}`]) && row.includes(`${band.offset_m} m apart`) && !/[{}]/.test(row));
    // The published skyline gives the card's own answer, so a marked answer is "yes" on the lowest and "no" on the highest.
    for (const b of ['sun', 'earth']) {
      assert.equal(html.includes(`answer-${b === 'sun' ? 'power' : 'comm'} is-flip`), range.judge[b].flip, `${id} ${b}`);
      if (range.judge[b].flip) assert.ok(range.judge[b].upLow && !range.judge[b].upHigh);
      else assert.equal(range.judge[b].upLow, up[b]);
    }
    assert.ok(html.includes('class="pano-band"'));
    const plain = resultHtml(t, r, view);
    assert.ok(!plain.includes('class="band') && !plain.includes('pano-band'));
  }
});
