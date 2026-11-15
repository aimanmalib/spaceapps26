// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Site-day calendar (ADR 0102): data/calendar.json = a fresh daily count from the frozen tables, adds up to
// data/overview.json, and every cell links to Compare in the existing ?s= format.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { relativeTable } from '../src/terrain.js';
import { makeT } from '../src/i18n.js';
import { visibleRows } from '../src/overview.js';
import { decodeScenarios } from '../src/share.js';
import { dailyCounts, months, sortSites, monthTotal, dayParts, dayIso, compareHref, gridHtml } from '../src/calendar.js';

const json = (p) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), 'utf8'));
const cal = json('data/calendar.json');
const ov = json('data/overview.json');
const cfg = json('config/calendar.json');
const sites = json('config/sites.json').sites;
const view = json('config/view.json');
const radius = view.timeline.year.disc_radius_deg;
const en = json('i18n/en.json');
const t = makeT(en);
const name = (id) => sites.find((s) => s.id === id)?.name ?? id;
const rel = (id) => {
  const h = new URL(`../data/horizon/${id}.json`, import.meta.url);
  return relativeTable(json(`data/ephem/${id}.json`), existsSync(h) ? json(`data/horizon/${id}.json`) : null);
};

test('calendar: one entry per listed site, whole UTC days from the first row of the tables', () => {
  assert.deepEqual(cal.sites.map((s) => s.site), sites.map((s) => s.id));
  assert.equal(cal.first_day, json('data/ephem/im-2.json').start.slice(0, 10));
  assert.equal(cal.days, 365);
  for (const s of cal.sites) for (const k of ['sun', 'earth', 'both', 'pick']) assert.equal(s[k].length, cal.days, `${s.site} ${k}`);
});

test('calendar: file = a fresh daily count, and the days add up to the one-year overview', () => {
  for (const s of cal.sites) {
    const table = rel(s.site);
    const fresh = dailyCounts(table, radius, cfg.pick_order, cfg.fallback_hour, view.horizon_threshold_deg);
    assert.deepEqual({ sun: s.sun, earth: s.earth, both: s.both, pick: s.pick }, fresh, s.site);
    const v = visibleRows(table, radius);
    const o = ov.sites.find((x) => x.site === s.site);
    for (const b of ['sun', 'earth', 'both']) {
      const extra = v[b].slice(cal.days * 24).filter(Boolean).length; // the single row at 00:00 after the last whole day
      const sum = s[b].reduce((a, x) => a + x, 0) + extra;
      assert.equal(Math.round((sum / o.hours) * 1000) / 1000, o[b], `${s.site} ${b}`);
    }
  }
});

test('calendar: each day splits into four parts of 24 hours; the picked hour has the first state of pick_order that occurs', () => {
  for (const s of cal.sites) {
    const v = visibleRows(rel(s.site), radius);
    const th = view.horizon_threshold_deg;
    const centre = visibleRows(rel(s.site), { sun: -th, earth: -th });
    for (let d = 0; d < cal.days; d++) {
      const p = dayParts(s, d);
      assert.ok(Object.values(p).every((x) => x >= 0) && p.both + p.sun + p.earth + p.none === 24, `${s.site} ${d}`);
      const want = cfg.pick_order.find((b) => s[b][d] > 0);
      const k = d * 24 + s.pick[d];
      if (want) {
        assert.ok(v[want][k], `${s.site} day ${d}: picked hour has ${want}`);
        const hasCentre = Array.from({ length: 24 }, (_, h) => centre[want][d * 24 + h]).some(Boolean);
        if (hasCentre) assert.ok(centre[want][k], `${s.site} day ${d}: Compare gives the same answer at the picked hour`);
      }
      else assert.equal(s.pick[d], cfg.fallback_hour);
    }
  }
});

test('pick: middle of the longest stretch of the first state that occurs', () => {
  const T = (sun, earth) => ({ step_minutes: 60, sun: { el: sun }, earth: { el: earth } });
  const r0 = { sun: 0, earth: 0 };
  const day = (on) => Array.from({ length: 24 }, (_, h) => (on(h) ? 1 : -1));
  // Sun 2–3 and 10–17, Earth always: both = Sun hours, longest run 10–17 → 13.
  const c = dailyCounts(T(day((h) => (h >= 2 && h <= 3) || (h >= 10 && h <= 17)), day(() => true)), r0, ['both', 'sun', 'earth'], 0);
  assert.deepEqual(c, { sun: [10], earth: [24], both: [10], pick: [13] });
  // Neither: fallback hour.
  assert.deepEqual(dailyCounts(T(day(() => false), day(() => false)), r0, ['both', 'sun', 'earth'], 5).pick, [5]);
});

test('months: twelve calendar months with their real lengths', () => {
  const m = months(cal.first_day, cal.days);
  assert.equal(m.length, 12);
  assert.deepEqual(m[0], { key: '2026-11', from: 0, to: 30 });
  assert.equal(m.find((x) => x.key === '2027-02').to - m.find((x) => x.key === '2027-02').from, 28);
  assert.equal(m.at(-1).to, cal.days);
  assert.equal(dayIso(cal.first_day, 30), '2026-12-01');
});

test('sort: Power = Sun hours, Comms = Earth hours, Both = both; most first, ties keep the list order', () => {
  const m = { key: 'x', from: 0, to: 2 };
  const a = { site: 'a', sun: [10, 10], earth: [0, 0], both: [0, 0] };
  const b = { site: 'b', sun: [5, 5], earth: [24, 24], both: [5, 5] };
  const c = { site: 'c', sun: [5, 5], earth: [24, 24], both: [5, 5] };
  assert.deepEqual(sortSites([a, b, c], 'power', m).map((s) => s.site), ['a', 'b', 'c']);
  assert.deepEqual(sortSites([c, a, b], 'comms', m).map((s) => s.site), ['c', 'b', 'a']);
  assert.deepEqual(sortSites([a, c, b], 'both', m).map((s) => s.site), ['c', 'b', 'a']);
  assert.equal(monthTotal(b, 'comms', m), 48);
  for (const s of cfg.sort_options) assert.ok(`calendar.sort.${s}` in en, s);
  assert.ok(cfg.sort_options.includes(cfg.default_sort));
});

test('every cell opens Compare for that site and day through the existing ?s= format', () => {
  const siteIds = new Set(sites.map((s) => s.id));
  const href = compareHref('im-2', '2026-12-14', 7, view.share);
  const { scenarios, rejected } = decodeScenarios(href.slice(2), { cfg: view.share, siteIds, max: view.max_scenarios });
  assert.equal(rejected, 0);
  assert.deepEqual(scenarios, [{ site: 'im-2', time_utc: '2026-12-14T07:00' }]);
  const m = months(cal.first_day, cal.days)[1];
  const html = gridHtml(t, cal, m, 'both', name, view.share);
  assert.equal((html.match(/<tr><th scope="row"/g) || []).length, sites.length);
  assert.equal((html.match(/class="cal-cell"/g) || []).length, sites.length * 31);
  for (const h of html.matchAll(/href="([^"]+)"/g)) {
    const r = decodeScenarios(h[1].slice(2), { cfg: view.share, siteIds, max: view.max_scenarios });
    assert.equal(r.scenarios.length, 1, h[1]);
    assert.ok(r.scenarios[0].time_utc.startsWith('2026-12-'), h[1]);
  }
});

test('grid text is escaped', () => {
  const data = { first_day: '2026-11-01', sites: [{ site: 'x', sun: [1], earth: [1], both: [1], pick: [0] }] };
  const html = gridHtml(t, data, { key: '2026-11', from: 0, to: 1 }, 'both', () => '<b>&', view.share);
  assert.ok(html.includes('&lt;b&gt;&amp;') && !html.includes('<b>&'));
});
