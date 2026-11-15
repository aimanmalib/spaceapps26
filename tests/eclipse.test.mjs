// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Lunar eclipses seen from the site (ADR 0109): the geometry, the per-row flags, the card/timeline/Mission check use, the
// check against the NASA GSFC list (data/eclipses.json from scripts/eclipses.mjs) and the battery estimate.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { separation, coveredShare, eclipseOf, eclipseRows, eclipseSpans, eclipseAround, withEclipses } from '../src/eclipse.js';
import { parseUtc, sampleAt, tableRange } from '../src/ephem.js';
import { relativeTable } from '../src/terrain.js';
import { missionMetrics, batteryKwh } from '../src/metrics.js';
import { bothUp } from '../src/mission.js';
import { rowsIn, shareAbove, eclipseMarks, timelineSvg } from '../src/timeline.js';
import { visibleRows } from '../src/overview.js';

const root = new URL('../', import.meta.url);
const json = (p) => JSON.parse(readFileSync(new URL(p, root), 'utf8'));
const view = json('config/view.json');
const radii = view.timeline.year.disc_radius_deg;
const cfg = json('config/eclipses.json');
const result = json('data/eclipses.json');
const metricsCfg = json('config/metrics.json');

test('separation: same point 0, a degree apart in elevation 1, azimuth shrinks with cos(elevation)', () => {
  assert.equal(separation({ az: 10, el: 5 }, { az: 10, el: 5 }), 0);
  assert.ok(Math.abs(separation({ az: 10, el: 5 }, { az: 10, el: 6 }) - 1) < 1e-9);
  assert.ok(Math.abs(separation({ az: 0, el: 60 }, { az: 2, el: 60 }) - 1) < 0.01);
  assert.ok(Math.abs(separation({ az: 359.5, el: 0 }, { az: 0.5, el: 0 }) - 1) < 1e-9);
});

test('covered share: none outside the sum of radii, all inside the difference, half-ish at the limb, monotonic', () => {
  const { sun: rs, earth: re } = radii;
  assert.equal(coveredShare(rs + re, rs, re), 0);
  assert.equal(coveredShare(re - rs, rs, re), 1);
  const atLimb = coveredShare(re, rs, re);
  assert.ok(atLimb > 0.4 && atLimb < 0.5, String(atLimb)); // Earth's limb curves away from the Sun's centre
  let prev = 1;
  for (let d = re - rs; d <= rs + re; d += 0.01) {
    const v = coveredShare(d, rs, re);
    assert.ok(v <= prev + 1e-12 && v >= 0 && v <= 1);
    prev = v;
  }
  assert.deepEqual(eclipseOf({ sun: { az: 0, el: 5 }, earth: { az: 0, el: 5.2 } }, radii).state, 'total');
  assert.deepEqual(eclipseOf({ sun: { az: 0, el: 5 }, earth: { az: 0, el: 9 } }, radii).state, 'none');
});

test('every eclipse the tables show (2026-11 to 2030-12, 14 sites) is on the NASA GSFC list, every partial/total one is seen everywhere', () => {
  assert.ok(cfg.source_urls.every((u) => u.startsWith('https://eclipse.gsfc.nasa.gov/')));
  assert.equal(result.summary.pass, true);
  assert.equal(result.summary.unmatched, 0);
  assert.equal(result.summary.missed_umbral, 0);
  assert.ok(result.found.every((f) => cfg.nasa.some((x) => x.date === f.nasa)));
  for (const x of cfg.nasa.filter((y) => y.umbral_mag > 0)) assert.equal(result.per_eclipse.find((p) => p.date === x.date).sites_seen, 14, x.date);
  // The totals hide the whole Sun somewhere; penumbral ones never do (part of the Moon is never in the full shadow).
  for (const p of result.per_eclipse) {
    if (p.type === 'total') assert.equal(p.max_share, 1, p.date);
    if (p.type === 'penumbral') assert.ok(p.max_share < 1, p.date);
  }
});

test('the frozen IM-2 table (JPL Horizons) shows the 17 Aug 2027 eclipse; the card flips at 07:00 and says when the centre clears', () => {
  const table = json('data/ephem/im-2.json');
  const before = eclipseAround(table, parseUtc('2027-08-17T05:00'), radii);
  assert.equal(before, null);
  const ms = parseUtc('2027-08-17T07:00');
  const e = eclipseAround(table, ms, radii);
  assert.equal(e.now.centre, true);
  assert.ok(e.now.share > 0.5 && e.now.share < 0.6, String(e.now.share));
  assert.ok(e.startMs < ms && e.centreEndMs > ms && e.endMs > e.centreEndMs);
  assert.ok(Math.abs(e.peakMs - Date.parse('2027-08-17T07:15:00Z')) <= 3_600_000);
  const spans = eclipseSpans(eclipseRows(table, radii));
  assert.ok(spans.length >= 1 && spans.every((s) => s.share < 1)); // the frozen year has penumbral eclipses only
});

test('Mission check, Next windows and timeline count the Sun behind Earth as no sunlight; calendar rule is unchanged', () => {
  const table = json('data/ephem/im-2.json');
  const profile = json('data/horizon/im-2.json');
  const plain = relativeTable(table, profile);
  const rel = withEclipses(plain, table, radii);
  const from = parseUtc('2027-08-17T00:00');
  const o = { threshold: 0, solar: metricsCfg.solar_constant_w_m2, sunRadius: radii.sun };
  const a = missionMetrics(table, plain, from, 1, o);
  const b = missionMetrics(table, rel, from, 1, o);
  assert.ok(b.sunPct < a.sunPct, `${b.sunPct} < ${a.sunPct}`);
  assert.ok(b.power.tracking < a.power.tracking);
  assert.ok(b.eclipse.hours >= 3 && b.eclipse.centreHours >= 1 && b.eclipse.share > 0.5);
  assert.equal(a.eclipse.hours, 0);
  const k = Math.round((parseUtc('2027-08-17T07:00') - tableRange(table).startMs) / 3_600_000);
  assert.equal(bothUp(plain)[k], true);
  assert.equal(bothUp(rel)[k], false);
  const rows = rowsIn(rel, from, from + 86_400_000);
  assert.ok(shareAbove(rows, 'sun') < shareAbove(rowsIn(plain, from, from + 86_400_000), 'sun'));
  const marks = eclipseMarks(rows);
  assert.equal(marks.length, 1);
  assert.ok(timelineSvg(rows, { from, to: from + 86_400_000 }, from, 10).includes('tl-eclipse'));
  // Calendar (any part of the disc, ADR 0102): a penumbral eclipse never covers the whole Sun, so no daily count changes.
  const v = visibleRows(plain, { sun: radii.sun, earth: radii.earth });
  const er = eclipseRows(table, radii);
  assert.ok(v.sun.every((up, i) => !up || er.share[i] < 1));
});

test('battery for the longest night: example load from config, kWh = W x h / 1000', () => {
  assert.equal(metricsCfg.battery.load_w, 100);
  assert.match(metricsCfg._note_battery, /EXAMPLE/);
  assert.equal(batteryKwh(336, 100), 33.6);
  assert.equal(batteryKwh(0, 100), 0);
});

test('realism texts exist in every language with the same placeholders', () => {
  const langs = ['en', 'id', 'ms'].map((c) => json(`i18n/${c}.json`));
  const keys = Object.keys(langs[0]).filter((k) => k.startsWith('realism.') || k === 'preset.eclipse');
  assert.ok(keys.length >= 12);
  const ph = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join();
  for (const k of keys) for (const l of langs) assert.equal(ph(l[k] ?? ''), ph(langs[0][k]), k);
});
