// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { earthViewSvg, skylineIn, frame } from '../src/earthview.js';
import { aboveHorizon } from '../src/terrain.js';

const root = new URL('../', import.meta.url);
const cfg = JSON.parse(readFileSync(new URL('config/earthview.json', root), 'utf8'));
const view = JSON.parse(readFileSync(new URL('config/view.json', root), 'utf8'));
// Fixture profile (not project data): skyline rising 0.1° per degree of azimuth.
const profile = { azimuth_step_deg: 0.5, elev: Array.from({ length: 720 }, (_, i) => +(Math.sin((i / 720) * 2 * Math.PI) * 2).toFixed(2)) };

test('viewBox is in degrees: width = width_deg, disc radius = configured radius, disc centred on the body azimuth', () => {
  const r = view.timeline.year.disc_radius_deg.earth;
  const { svg, lo, hi } = earthViewSvg({ body: 'earth', pos: { az: 120, el: 1.2 }, profile, radius: r, cfg });
  const [, , w, h] = /viewBox="([^"]+)"/.exec(svg)[1].split(' ').map(Number);
  assert.equal(w, cfg.width_deg);
  assert.ok(Math.abs(h - (hi - lo)) < 1e-3);
  assert.match(svg, /preserveAspectRatio="xMidYMid meet"/);
  const c = /<circle class="ev-body ev-earth" cx="([^"]+)" cy="([^"]+)" r="([^"]+)"/.exec(svg);
  assert.equal(+c[1], cfg.width_deg / 2);
  assert.ok(Math.abs(+c[2] - (hi - 1.2)) < 1e-3);
  assert.ok(Math.abs(+c[3] - r) < 1e-3);
});

test('margin is the same centre-above-skyline value as the card answers', () => {
  const pos = { az: 359.8, el: 0.4 };
  const { margin } = earthViewSvg({ body: 'sun', pos, profile, radius: 0.267, cfg });
  assert.equal(margin, aboveHorizon(pos, profile));
});

test('skyline covers the whole window and wraps at 360°', () => {
  const line = skylineIn(profile, 350, 26);
  assert.equal(line[0][0], 0);
  assert.equal(line.at(-1)[0], 26);
  assert.ok(line.every(([x], i) => i === 0 || x > line[i - 1][0]));
});

test('frame keeps the disc, the skyline and 0° inside, at least min_height_deg tall', () => {
  const f = frame({ el: 6 }, 0.95, [[0, -0.5], [26, 0.3]], cfg);
  assert.ok(f.hi >= 6 + 0.95 && f.lo <= -0.5);
  const g = frame({ el: 0.1 }, 0.95, [[0, 0], [26, 0.1]], cfg);
  assert.ok(g.hi - g.lo >= cfg.min_height_deg - 1e-9);
});
