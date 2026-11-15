// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { makeT } from '../src/i18n.js';
import { sampleAt, parseUtc } from '../src/ephem.js';
import { judge } from '../src/shifts.js';
import { horizonAt } from '../src/terrain.js';
import { QUESTIONS, roundAnswers, marks, reasonText, playableRounds } from '../src/game.js';

const root = new URL('../', import.meta.url);
const json = (p) => JSON.parse(readFileSync(new URL(p, root), 'utf8'));
const en = json('i18n/en.json');
const t = makeT(en);
const game = json('config/game.json');
const view = json('config/view.json');
const siteIds = new Set(json('config/sites.json').sites.map((s) => s.id));
const profileOf = (id) => (existsSync(new URL(`data/horizon/${id}.json`, root)) ? json(`data/horizon/${id}.json`) : null);

// Fixture: a two-row table and a flat 2° skyline (shape only, no project data).
const table = { start: '2026-11-01 00:00', step_minutes: 60, sun: { az: [90, 90], el: [1.5, 1.5] }, earth: { az: [0, 0], el: [3, 3] } };
const flat = { azimuth_step_deg: 90, elev: [2, 2, 2, 2] };

test('config/game.json: rounds hold only a listed site and a time, never an answer', () => {
  assert.ok(game.rounds.length >= 4);
  for (const r of game.rounds) {
    assert.deepEqual(Object.keys(r).sort(), ['site', 'time_utc']);
    assert.ok(siteIds.has(r.site), r.site);
    assert.match(r.time_utc, /^\d{4}-\d\d-\d\dT\d\d:\d\d$/);
  }
});

test('every round answer = the Compare page judgement on the same frozen table and skyline', () => {
  for (const r of game.rounds) {
    const tb = json(`data/ephem/${r.site}.json`);
    const profile = profileOf(r.site);
    const a = roundAnswers(tb, profile, r.time_utc, view.horizon_threshold_deg);
    assert.ok(a, `${r.site} ${r.time_utc} inside the table`);
    assert.deepEqual(a.judged, judge(sampleAt(tb, parseUtc(r.time_utc)), profile, view.horizon_threshold_deg));
  }
});

test('the rounds mix yes and no for both questions, and include terrain and ideal-sphere sites', () => {
  const answers = game.rounds.map((r) => roundAnswers(json(`data/ephem/${r.site}.json`), profileOf(r.site), r.time_utc, view.horizon_threshold_deg).judged);
  for (const q of QUESTIONS) assert.deepEqual(new Set(answers.map((a) => a[q.body].up)), new Set([true, false]), q.body);
  const kinds = new Set(game.rounds.map((r) => !!profileOf(r.site)));
  assert.deepEqual(kinds, new Set([true, false]));
});

test('the terrain skyline changes the answer: Sun 1.5° above the sphere horizon is below a 2° skyline', () => {
  const sphere = roundAnswers(table, null, '2026-11-01T00:00', 0).judged;
  const terrain = roundAnswers(table, flat, '2026-11-01T00:00', 0).judged;
  assert.equal(sphere.sun.up, true);
  assert.equal(terrain.sun.up, false);
  assert.equal(terrain.earth.up, true);
  assert.equal(roundAnswers(table, null, '2028-01-01T00:00', 0), null);
});

test('marks: one point per right answer, a missing guess is wrong', () => {
  const j = { sun: { up: true }, earth: { up: false } };
  assert.deepEqual(marks(j, { sun: true, earth: false }), { sun: true, earth: true, points: 2 });
  assert.deepEqual(marks(j, { sun: false, earth: false }), { sun: false, earth: true, points: 1 });
  assert.equal(marks(j, { sun: null, earth: true }).points, 0);
});

test('reason sentence uses the same numbers: elevation, skyline in that direction, margin', () => {
  const sample = sampleAt(table, parseUtc('2026-11-01T00:00'));
  const terrain = roundAnswers(table, flat, '2026-11-01T00:00', 0).judged;
  const s = reasonText(t, 'sun', sample, flat, terrain.sun.margin, 1);
  assert.ok(s.includes('+1.5°') && s.includes('azimuth 90°') && s.includes(`+${horizonAt(flat, 90).toFixed(1)}°`) && s.includes('0.5° below'), s);
  const p = reasonText(t, 'earth', sample, null, 3, 1);
  assert.ok(p.includes('+3.0°') && p.includes('3.0° above') && !p.includes('{'), p);
});

test('unknown sites in config are skipped; every play.* key used by the page exists', () => {
  assert.deepEqual(playableRounds([{ site: 'x' }, { site: 'im-2' }], siteIds), [{ site: 'im-2' }]);
  const src = readFileSync(new URL('src/play-main.js', root), 'utf8') + readFileSync(new URL('src/game.js', root), 'utf8');
  const keys = [...src.matchAll(/t\('(play\.[a-z_]+)'\)/g)].map((m) => m[1]);
  for (const v of ['yes', 'no']) keys.push(`play.${v}`);
  for (const q of QUESTIONS) keys.push(`play.q_${q.key}`);
  for (const k of keys) assert.ok(k in en, k);
});
