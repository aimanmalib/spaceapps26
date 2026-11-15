// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// First screen (P4b): the large number on each answer is the margin from the horizon used — the same value the
// small-shifts table shows — and terrain sites get a ±near_horizon_deg strip under the panorama.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { makeT } from '../src/i18n.js';
import { scenarioFacts } from '../src/facts.js';
import { judge } from '../src/shifts.js';
import { horizonAt, relativeTable } from '../src/terrain.js';
import { sampleAt } from '../src/ephem.js';
import { resultHtml } from '../src/result.js';

const root = new URL('../', import.meta.url);
const en = JSON.parse(readFileSync(new URL('i18n/en.json', root), 'utf8'));
const view = JSON.parse(readFileSync(new URL('config/view.json', root), 'utf8'));
const t = makeT(en);

// Fixture: Sun below a +3° skyline although above the ideal sphere; Earth above the sphere, below a −2° skyline
// to the south — the two cases where elevation and answer used to disagree on the card.
const table = {
  start: '2026-01-01T00:00Z',
  step_minutes: 60,
  sun: { az: [90, 91, 92, 93], el: [0.9, 1.0, 1.1, 1.2] },
  earth: { az: [180, 180, 180, 180], el: [-0.1, -0.1, -0.1, -0.1] },
};
const profile = { azimuth_step_deg: 90, observer_height_m: 2, elev: [0, 3, -2, 0] };
const MS = Date.UTC(2026, 0, 1, 0, 0);

function scenario(prof) {
  const sample = sampleAt(table, MS);
  const j = judge(sample, prof, view.horizon_threshold_deg);
  const up = { sun: j.sun.up, earth: j.earth.up };
  const margin = { sun: j.sun.margin, earth: j.earth.margin };
  const facts = scenarioFacts(t, relativeTable(table, prof), MS, { sample, up, margin }, view);
  const site = { id: 'x', lat: -84, lon_east: 0, radius_km: 1737.4, source: { url: 'https://example.org/', publisher: 'P' } };
  return { j, sample, facts, html: resultHtml(t, { site, sample, up, profile: prof, facts, scale: 90 }, view) };
}

test('margin = elevation − skyline at the body azimuth, equal to the small-shifts judgement', () => {
  const { j, sample, facts } = scenario(profile);
  for (const b of ['sun', 'earth']) {
    assert.equal(facts[b].margin, sample[b].el - horizonAt(profile, sample[b].az));
    assert.equal(facts[b].margin, j[b].margin);
  }
  assert.equal(facts.sun.marginText, '−2.1°');
  assert.equal(facts.earth.marginText, '+1.9°');
  assert.equal(facts.sun.elText, '+0.9°'); // Horizons elevation kept for the small line
});

test('card: large number agrees with the answer; Horizons elevation and skyline move to a small line', () => {
  const { html } = scenario(profile);
  assert.match(html, /is-down answer-power[\s\S]*?answer-deg">2\.1°<\/span><span class="answer-unit">Sun below the terrain horizon/);
  assert.match(html, /is-up answer-comm[\s\S]*?answer-deg">1\.9°<\/span><span class="answer-unit">Earth above the terrain horizon/);
  assert.ok(html.includes('Sun elevation +0.9° (JPL Horizons) · terrain skyline in that direction +3.0°'));
  assert.ok(html.includes('Earth elevation −0.1° (JPL Horizons) · terrain skyline in that direction −2.0°'));
});

test('terrain site: near-horizon strip at ±near_horizon_deg; ideal sphere: none, margin = elevation', () => {
  const s = view.near_horizon_deg;
  assert.ok(Number.isFinite(s) && s > 0);
  const terrain = scenario(profile).html;
  assert.equal((terrain.match(/class="sky sky-near"/g) || []).length, 1);
  assert.ok(terrain.includes(`>+${s}°</span>`) && terrain.includes(`>−${s}°</span>`));
  const sphere = scenario(null);
  assert.ok(!sphere.html.includes('sky-near'));
  assert.ok(!sphere.html.includes('(JPL Horizons)'));
  assert.equal(sphere.facts.sun.margin, sphere.sample.sun.el);
  assert.match(sphere.html, /answer-deg">0\.1°<\/span><span class="answer-unit">Earth below the ideal sphere horizon/);
});

test('page order: one-sentence intro, explanation folded, cards before the side-by-side table', () => {
  const html = readFileSync(new URL('index.html', root), 'utf8');
  const at = (s) => html.indexOf(s);
  assert.ok(at('data-i18n="tool.lede"') > 0);
  assert.equal((en['tool.lede'].match(/\.(\s|$)/g) || []).length, 1); // one sentence
  assert.ok(at('<details class="tech how">') < at('data-i18n="app.status"'));
  assert.ok(at('<details class="tech how">') < at('data-i18n="tool.intro"'));
  assert.ok(at('data-i18n="tool.data_label"') < at('</details>'));
  assert.ok(at('class="cards"') < at('class="glance"'));
  assert.ok(view.first_card.shifts_open === true && view.first_card.map_open_min_width_px > 0);
});

test('P4v first screen: verdicts, validation line and buttons come right after the intro, before the cards', () => {
  const html = readFileSync(new URL('index.html', root), 'utf8');
  const at = (s) => html.indexOf(s);
  assert.ok(at('data-i18n="tool.lede"') < at('class="verdicts"'));
  assert.ok(at('class="verdicts"') < at('class="trust'));
  assert.ok(at('class="trust') < at('class="tool-actions"'));
  assert.ok(at('class="tool-actions"') < at('class="cards"'));
});

test('P4v validation line: every number read from data/validation.json', async () => {
  const { trustText } = await import('../src/trust.js');
  const v = JSON.parse(readFileSync(new URL('data/validation.json', root), 'utf8'));
  const text = trustText(t, v, 4);
  const h = v.horizons;
  assert.ok(text.includes(`${h.max_abs_deg.toFixed(4)}°`));
  assert.ok(text.includes(`at ${h.same_answer.of} random times`));
  assert.ok(text.includes(`answer ${h.same_answer.power} of ${h.same_answer.of}`));
  assert.ok(text.includes(`${(v.pgda.sun.max_abs * 100).toFixed(1)} percentage points`));
  assert.ok(!/[{}]/.test(text));
});

test('P4v card: elevation line and window length fold under each answer', () => {
  const { html } = scenario(profile);
  assert.equal((html.match(/<details class="answer-more">/g) || []).length, 2);
  assert.match(html, /<details class="answer-more"><summary>Elevation and window length<\/summary><span class="answer-sky">Sun elevation/);
});
