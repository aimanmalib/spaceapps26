// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { makeT, fill } from '../src/i18n.js';
import { parseUtc } from '../src/ephem.js';
import { decodeScenarios } from '../src/share.js';
import { horizonKm } from '../src/moonearth.js';
import { stepsHtml, factsHtml, stepHref, totalMinutes } from '../src/teach.js';

const root = new URL('../', import.meta.url);
const json = (p) => JSON.parse(readFileSync(new URL(p, root), 'utf8'));
const en = json('i18n/en.json');
const t = makeT(en);
const teach = json('config/teach.json');
const view = json('config/view.json');
const me = json('config/moon-earth.json');
const ephem = json('config/ephemeris.json');
const siteIds = new Set(json('config/sites.json').sites.map((s) => s.id));
const values = { shifts: t('shift.heading'), km: 1, start: ephem.start, stop: ephem.stop };
const base = 'https://example.org/';
const render = () => stepsHtml({ t, cfg: teach, share: view.share, siteName: (id) => id, base, values });

test('teach: every step links to the game page or to listed sites at times inside the frozen tables', () => {
  const [start, stop] = [ephem.start, ephem.stop].map((s) => parseUtc(s.replace(' ', 'T')));
  for (const s of teach.steps) {
    assert.ok(Number.isInteger(s.minutes) && s.minutes > 0, s.key);
    assert.ok(Boolean(s.page) !== Boolean(s.scenarios), `${s.key}: either a page or scenarios`);
    if (s.page) {
      assert.ok(existsSync(new URL(s.page, root)) || existsSync(new URL(`src/${s.page}`, root)), s.page);
      continue;
    }
    for (const sc of s.scenarios) {
      assert.ok(siteIds.has(sc.site), sc.site);
      const ms = parseUtc(sc.time_utc);
      assert.ok(ms >= start && ms <= stop, sc.time_utc);
    }
    // The link opens exactly these scenarios in the tool (same decoder as the Compare page).
    const href = stepHref(s, view.share);
    const back = decodeScenarios(href.slice(2), { cfg: view.share, siteIds, max: 4 });
    assert.equal(back.rejected, 0);
    assert.deepEqual(back.scenarios, s.scenarios);
  }
});

test('teach: the step about 1 km shifts uses a site with a terrain skyline', () => {
  const km = teach.steps.find((s) => s.key === 'km');
  for (const sc of km.scenarios) assert.ok(existsSync(new URL(`data/horizon/${sc.site}.json`, root)), sc.site);
});

test('teach: every step has its texts, all placeholders filled, and no answer written on the page', () => {
  for (const s of teach.steps) for (const part of ['title', 'do', 'ask', 'link']) assert.ok(`teach.${s.key}.${part}` in en, `${s.key}.${part}`);
  const html = render();
  assert.equal((html.match(/class="teach-step"/g) || []).length, teach.steps.length);
  assert.ok(!/\{[a-z_]+\}/.test(html), 'unfilled placeholder');
  // Answers come from the tool: no elevations or margins in degrees on this page.
  assert.ok(!html.includes('°'), 'degrees written on the teach page');
  assert.ok(html.includes(`${base}play.html`) && html.includes(`${base}?s=`), 'printed addresses are absolute');
  assert.ok(fill(t('teach.heading'), { minutes: totalMinutes(teach.steps) }).includes(String(totalMinutes(teach.steps))));
});

test('teach: Moon and Earth rows are the quoted values and the computed horizon distance', () => {
  const html = factsHtml({ t, keys: teach.facts, me });
  assert.equal((html.match(/<tr><th scope="row">/g) || []).length, teach.facts.length);
  for (const v of [String(me.moon.synodic_period_days), me.moon.surface_pressure_text, me.earth.surface_pressure_text,
    horizonKm(me.moon.radius_km, me.observer_height_m).toFixed(me.decimals)]) assert.ok(html.includes(v), v);
  assert.ok(html.includes(me.sources.moon.url) && html.includes(me.sources.earth.url));
});
