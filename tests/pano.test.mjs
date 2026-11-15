// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Horizon first (ADR 0040): the verdict and the 360-degree strip that open every card follow from the card's own
// sample, answers and skyline.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { makeT } from '../src/i18n.js';
import { sampleAt, parseUtc } from '../src/ephem.js';
import { judge } from '../src/shifts.js';
import { panoHtml, panoY, panoScale, panoMarks, verdictKey } from '../src/pano.js';

const root = new URL('../', import.meta.url);
const load = (rel) => JSON.parse(readFileSync(new URL(rel, root), 'utf8'));
const view = load('config/view.json');
const en = load('i18n/en.json');
const t = makeT(en);

function card(site, time) {
  const table = load(`data/ephem/${site}.json`);
  let profile = null;
  try {
    profile = load(`data/horizon/${site}.json`);
  } catch {
    profile = null;
  }
  const sample = sampleAt(table, parseUtc(time));
  const j = judge(sample, profile, view.horizon_threshold_deg);
  return { sample, profile, up: { sun: j.sun.up, earth: j.earth.up } };
}

test('verdict: one of four short sentences, chosen by the same two answers as the card', () => {
  assert.equal(verdictKey({ sun: true, earth: true }), 'both');
  assert.equal(verdictKey({ sun: true, earth: false }), 'sun');
  assert.equal(verdictKey({ sun: false, earth: true }), 'earth');
  assert.equal(verdictKey({ sun: false, earth: false }), 'none');
  const [a, b] = view.default_scenarios.map((s) => card(s.site, s.time_utc));
  assert.ok(panoHtml(t, a, view).includes(`<p class="pano-verdict">${en['pano.verdict.earth']}</p>`));
  assert.ok(panoHtml(t, b, view).includes(`<p class="pano-verdict">${en['pano.verdict.both']}</p>`));
  for (const k of ['both', 'sun', 'earth', 'none']) assert.ok(en[`pano.verdict.${k}`].length <= 30, k); // one line on a phone
});

test('strip: skyline only where the site has one, two markers at the sample azimuths, hollow when below', () => {
  const im2 = card('im-2', '2026-11-14T00:00');
  const html = panoHtml(t, im2, view);
  assert.ok(html.includes('class="sky-terrain"') && html.includes(en['pano.terrain']));
  assert.ok(html.includes('pano-dot pano-sun is-down') && html.includes('pano-dot pano-earth is-up'));
  const scale = panoScale(im2.sample, view.pano_scale_steps_deg);
  assert.equal(scale, 5);
  assert.ok(html.includes(`±${scale}°`));
  for (const m of panoMarks(im2.sample, im2.up, scale)) {
    assert.ok(Math.abs(m.x - Math.max(2.5, Math.min(97.5, im2.sample[m.body].az / 3.6))) < 1e-9, m.body);
    assert.ok(html.includes(`left:${m.x.toFixed(2)}%;top:${m.y.toFixed(2)}%`), m.body);
  }
  const apollo = card('apollo-11', '2026-11-14T00:00');
  const flat = panoHtml(t, apollo, view);
  assert.ok(!flat.includes('sky-terrain') && flat.includes('class="sky-horizon"') && flat.includes(en['pano.sphere']));
  assert.ok(view.pano_scale_steps_deg.includes(panoScale(apollo.sample, view.pano_scale_steps_deg)));
});

test('scale and positions: zero in the middle, values beyond the scale stay at the edge, close labels do not overlap', () => {
  assert.equal(panoY(0, 5), 50);
  assert.equal(panoY(5, 5), panoY(40, 5));
  assert.equal(panoY(-5, 5), 100 - panoY(5, 5));
  assert.ok(panoY(5, 5) > 0 && panoY(-5, 5) < 100);
  assert.equal(panoScale({ sun: { el: 4.9 }, earth: { el: -5 } }, [5, 10, 20, 45, 90]), 5);
  assert.equal(panoScale({ sun: { el: 5.1 }, earth: { el: 0 } }, [5, 10, 20, 45, 90]), 10);
  assert.equal(panoScale({ sun: { el: 0 }, earth: { el: 70 } }, [5, 10, 20, 45, 90]), 90);
  const near = panoMarks({ sun: { az: 100, el: 1 }, earth: { az: 105, el: 2 } }, { sun: true, earth: true }, 5);
  assert.notEqual(near[0].left, near[1].left);
  const edge = panoMarks({ sun: { az: 350, el: 1 }, earth: { az: 10, el: 2 } }, { sun: true, earth: true }, 5);
  assert.equal(edge.find((m) => m.body === 'sun').left, true);
  assert.equal(edge.find((m) => m.body === 'earth').left, false);
});

test('page: the card result starts with the strip, then the two answers (the Earth view still follows the answers)', () => {
  const css = readFileSync(new URL('src/styles.css', root), 'utf8');
  assert.ok(css.includes('.pano-plot') && css.includes('preserveAspectRatio none'));
  const src = readFileSync(new URL('src/result.js', root), 'utf8');
  assert.ok(src.indexOf('panoHtml(t, r, view)') < src.indexOf('<ul class="answers">'));
});
