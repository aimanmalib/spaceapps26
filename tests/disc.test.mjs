// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// P4u: three-state disc label and the "Over the whole year" shares (data/shift-year/).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { discState, discRadii, centreShare } from '../src/disc.js';
import { yearRows } from '../src/shifts.js';
import { relativeTable } from '../src/terrain.js';
import { isAbove } from '../src/ephem.js';

const load = (rel) => JSON.parse(readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8'));
const view = load('config/view.json');

test('discState: whole disc, part of it, or none of it above the horizon', () => {
  assert.equal(discState(1, 0.27), 'full');
  assert.equal(discState(0.27, 0.27), 'part');
  assert.equal(discState(0, 0.27), 'part');
  assert.equal(discState(-0.2, 0.27), 'part');
  assert.equal(discState(-0.27, 0.27), 'hidden');
  assert.equal(discState(-3, 0.95), 'hidden');
});

test('disc radii come from config and match the PGDA check', () => {
  assert.deepEqual(discRadii(view), load('config/pgda.json').disc_radius_deg);
});

test('the yes/no answer (centre of the disc) is unchanged by the three-state label', () => {
  // A centre at +0.0x° is still "yes" (published rule) and "part" (new label).
  assert.equal(isAbove(0.04, view.horizon_threshold_deg), true);
  assert.equal(discState(0.04, discRadii(view).sun), 'part');
});

test('centreShare counts rows with the centre above the horizon used', () => {
  const table = { sun: { az: [0, 90, 180, 270], el: [-1, 0, 0.5, 2] }, earth: { az: [0, 0, 0, 0], el: [1, 1, 1, 1] } };
  assert.equal(centreShare(table, null, 'sun', 0), 2 / 4);
  assert.equal(centreShare(table, { azimuth_step_deg: 90, elev: [1, 1, 1, 1] }, 'sun', 0), 1 / 4);
  assert.equal(centreShare(table, { azimuth_step_deg: 90, elev: [1, 1, 1, 1] }, 'earth', 0), 0);
});

const year = load('data/shift-year/shift-year.json');

test('shift-year: site disc shares = the published PGDA tool values (data/validation.json)', () => {
  const pg = new Map(load('data/validation.json').pgda.sites.map((s) => [s.site, s.tool]));
  assert.ok(year.sites.length >= 1);
  for (const s of year.sites) {
    assert.deepEqual(s.disc, pg.get(s.site), s.site);
    for (const b of ['sun', 'earth']) assert.ok(s.centre[b] <= s.disc[b], `${s.site} ${b}: centre share cannot exceed disc share`);
  }
});

test('shift-year: site centre shares recomputed from the frozen table and skyline', () => {
  for (const s of year.sites) {
    const table = load(`data/ephem/${s.site}.json`);
    const profile = load(`data/horizon/${s.site}.json`);
    for (const b of ['sun', 'earth']) assert.equal(Math.round(centreShare(table, profile, b, view.horizon_threshold_deg) * 1000) / 1000, s.centre[b]);
    assert.equal(s.hours, table.sun.el.length);
  }
});

test('shift-year: nearby points roughly = site angles over their own skyline (coarse check)', () => {
  for (const s of year.sites) {
    const table = load(`data/ephem/${s.site}.json`);
    const shift = load(`data/shift/${s.site}.json`);
    assert.deepEqual(s.points.map((p) => p.dir), shift.points.map((p) => p.dir));
    for (const p of s.points) {
      const prof = { elev: shift.points.find((q) => q.dir === p.dir).elev, azimuth_step_deg: shift.azimuth_step_deg };
      const rel = relativeTable(table, prof);
      for (const b of ['sun', 'earth']) {
        const coarse = rel[b].el.filter((v) => v > view.horizon_threshold_deg).length / rel[b].el.length;
        assert.ok(Math.abs(coarse - p.centre[b]) <= 0.01, `${s.site} ${p.dir} ${b}: ${coarse} vs ${p.centre[b]}`);
      }
    }
    assert.ok(s.site_angles_effect_max <= 0.01);
  }
});

test('yearRows: site first, then the point that differs most (Earth first, then Sun)', () => {
  const entry = { centre: { sun: 0.4, earth: 0.8 }, points: [
    { dir: 'n', centre: { sun: 0.1, earth: 0.79 } },
    { dir: 's', centre: { sun: 0.45, earth: 0.5 } },
    { dir: 'e', centre: { sun: 0.4, earth: 0.8 } },
  ] };
  const { rows, far } = yearRows(entry);
  assert.equal(rows.length, 4);
  assert.equal(rows[0].dir, null);
  assert.equal(far.dir, 's');
});
