// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// "Try a comparison" (ADR 0100): config/presets.json is valid (listed sites, hourly times inside the frozen tables, at
// most max_scenarios cards), each label exists in every language, the links use the shareable-link format and keep
// ?lang=, and the answers each preset shows are the ones written in its _answers note (same rule as the cards).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { presetSearch, presetProblems } from '../src/presets.js';
import { decodeScenarios } from '../src/share.js';
import { parseUtc, sampleAt } from '../src/ephem.js';
import { judge } from '../src/shifts.js';
import { eclipseOf } from '../src/eclipse.js';

const root = new URL('../', import.meta.url);
const json = (p) => JSON.parse(readFileSync(new URL(p, root), 'utf8'));
const { presets } = json('config/presets.json');
const view = json('config/view.json');
const eph = json('config/ephemeris.json');
const siteIds = new Set(json('config/sites.json').sites.map((s) => s.id));
const limits = { siteIds, startMs: parseUtc(eph.start.replace(' ', 'T')), endMs: parseUtc(eph.stop.replace(' ', 'T')), max: view.max_scenarios };

test('the four comparisons, in order, with no problems (the one-kilometre case stays the example button)', () => {
  assert.deepEqual(presets.map((p) => p.id), ['slip', 'im1', 'apollo_pole', 'ridge_seasons', 'eclipse']);
  assert.deepEqual(presetProblems(presets, limits), []);
});

test('problems are found: unknown site, time off the grid or outside the data, too many cards, repeated id', () => {
  const sc = (site, time_utc) => ({ site, time_utc });
  const bad = [
    { id: 'a', scenarios: [sc('nowhere', '2026-11-17T00:00')] },
    { id: 'b', scenarios: [sc('im-2', '2026-11-17T00:30')] },
    { id: 'c', scenarios: [sc('im-2', '2030-01-01T00:00')] },
    { id: 'd', scenarios: Array(view.max_scenarios + 1).fill(sc('im-2', '2026-11-17T00:00')) },
    { id: 'd', scenarios: [sc('im-2', '2026-11-17T00:00')] },
  ];
  assert.equal(presetProblems(bad, limits).length, 5);
});

test('labels in every language, new keys under preset.', () => {
  for (const code of ['en', 'id', 'ms']) {
    const t = json(`i18n/${code}.json`);
    for (const k of ['preset.heading', 'preset.label', 'preset.done', ...presets.map((p) => `preset.${p.id}`)]) assert.ok(t[k]?.trim(), `${code} ${k}`);
    assert.ok(t['preset.done'].includes('{name}'), code);
  }
});

test('the link is the shareable-link format, reads back to the same cards and keeps ?lang=', () => {
  for (const p of presets) {
    const q = presetSearch('?lang=ms&s=apollo-12,2026-11-01T00:00', p.scenarios, view.share);
    assert.ok(q.endsWith('&lang=ms'), q);
    assert.ok(!q.includes('apollo-12'), q);
    const back = decodeScenarios(q, { cfg: view.share, siteIds, max: view.max_scenarios });
    assert.deepEqual(back, { scenarios: p.scenarios, rejected: 0 });
  }
  assert.equal(presetSearch('', presets[0].scenarios, view.share), '?s=im-2,2026-11-17T00:00&s=im-2,2026-12-01T00:00');
});

test('no preset repeats the one-kilometre example button', () => {
  for (const p of presets) assert.notDeepEqual(p.scenarios, [view.example], p.id);
});

// Same rule as a card: centre of the disc against the LOLA skyline where one exists, else the ideal sphere; and the
// Sun's centre not behind Earth (lunar eclipse seen from the site, ADR 0109).
const answer = ({ site, time_utc }) => {
  const table = json(`data/ephem/${site}.json`);
  const hp = `data/horizon/${site}.json`;
  const sample = sampleAt(table, parseUtc(time_utc));
  const j = judge(sample, existsSync(new URL(hp, root)) ? json(hp) : null, view.horizon_threshold_deg);
  const behind = eclipseOf(sample, view.timeline.year.disc_radius_deg).centre;
  return (j.sun.up && !behind ? 'S' : 's') + (j.earth.up ? 'E' : 'e');
};

test('each preset shows the answers written in its note; the cards of a pair differ in at least one answer', () => {
  for (const p of presets) {
    const got = p.scenarios.map(answer);
    const noted = p._answers.match(/^([sS][eE])(?: (?:→|vs) ([sS][eE]))?:/).slice(1).filter(Boolean);
    assert.deepEqual(got, noted, p.id);
    if (got.length === 2) assert.notEqual(got[0], got[1], p.id);
  }
});

test('the row is on the Compare page between the title and the cards', () => {
  const html = readFileSync(new URL('index.html', root), 'utf8');
  assert.match(html, /<\/header>\s*<nav class="presets" data-i18n-attr="aria-label:preset.label" hidden><\/nav>\s*<section id="compare"/);
});
