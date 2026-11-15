// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Ground stations (ADR 0109): config/dsn.json copies NASA/JPL 810-005 module 301 Table 5; the Moon's elevation from each
// complex is plausible and at least one complex sees it above the limit most of the time; the card line reads well.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { moonElevation, dsnAt } from '../src/dsn.js';
import { dsnText } from '../src/dsn-ui.js';
import { makeT } from '../src/i18n.js';

const root = new URL('../', import.meta.url);
const json = (p) => JSON.parse(readFileSync(new URL(p, root), 'utf8'));
const cfg = json('config/dsn.json');

const dms = (text) => {
  const [d, m, s] = text.split(',')[0].trim().split(/\s+/).map(Number);
  return Math.sign(d) * (Math.abs(d) + m / 60 + s / 3600);
};

test('three complexes, coordinates = Table 5 of 810-005 module 301 (deg min sec → decimal), limit from config', () => {
  assert.match(cfg.source_url, /^https:\/\/deepspace\.jpl\.nasa\.gov\/dsndocs\/810-005\/301\//);
  assert.deepEqual(cfg.stations.map((s) => s.id), ['goldstone', 'madrid', 'canberra']);
  for (const s of cfg.stations) {
    assert.ok(Math.abs(dms(s.table5) - s.lat) < 1e-6, s.id);
    const lon = s.table5.split(',')[1].trim().split(/\s+/).map(Number);
    assert.ok(Math.abs(lon[0] + lon[1] / 60 + lon[2] / 3600 - s.lon_east) < 1e-6, s.id);
  }
  assert.equal(cfg.min_elevation_deg, 10);
});

test('Moon elevation: within ±90°, rises and sets over a day; one complex sees it above the limit ≥ 90 % of a month', () => {
  const t0 = Date.parse('2026-11-01T00:00Z');
  for (const s of cfg.stations) {
    const els = Array.from({ length: 25 }, (_, h) => moonElevation(s, t0 + h * 3_600_000));
    assert.ok(els.every((v) => v > -90 && v < 90));
    assert.ok(Math.max(...els) > 0 && Math.min(...els) < 0, s.id);
  }
  let up = 0;
  const n = 24 * 30;
  for (let h = 0; h < n; h++) if (dsnAt({ ...cfg, next_hours: 0 }, t0 + h * 3_600_000).rows.some((r) => r.up)) up++;
  assert.ok(up / n >= 0.9, String(up / n));
  // Full Moon of the 17 Aug 2027 eclipse, 07:00 UTC: high over the Pacific side, so Goldstone sees it, Madrid does not.
  const r = dsnAt(cfg, Date.parse('2027-08-17T07:00Z')).rows;
  assert.ok(r.find((x) => x.id === 'goldstone').up && !r.find((x) => x.id === 'madrid').up);
});

test('card line names the complexes and what they mean for the link, in every language', () => {
  for (const code of ['en', 'id', 'ms']) {
    const t = makeT(json(`i18n/${code}.json`));
    const ms = Date.parse('2027-08-17T07:00Z');
    const line = dsnText(t, cfg, dsnAt(cfg, ms), true, ms);
    assert.ok(line.includes('Goldstone (DSS 14) +40°') && line.includes('10°') && line.includes('−17°'), line);
    assert.ok(!/realism\./.test(line), line);
    const wait = dsnText(t, cfg, { rows: [{ id: 'madrid', el: 2, up: false }], next: { id: 'canberra', ms: ms + 3 * 3_600_000 } }, true, ms);
    assert.ok(wait.includes('Canberra (DSS 43)'), wait);
  }
});
