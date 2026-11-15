// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { encodeScenarios, decodeScenarios, nowTime, verdictText } from '../src/share.js';
import { makeT } from '../src/i18n.js';
import { parseUtc } from '../src/ephem.js';

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const view = read('../config/view.json');
const t = makeT(read('../i18n/en.json'));
// Fixed fixture (not project data): two site ids, coordinate limits shaped like config/custom.json.
const cfg = { param: 's', separator: ',', now_step_minutes: 60 };
const custom = { lat_min: -90, lat_max: 90, lon_min: -180, lon_max: 360 };
const opts = { cfg, siteIds: new Set(['site-a', 'site-b']), max: 4, custom };

test('config has the share settings', () => {
  assert.equal(typeof view.share.param, 'string');
  assert.equal(typeof view.share.separator, 'string');
  assert.ok(view.share.now_step_minutes > 0);
});

test('round trip: listed sites and own coordinates', () => {
  const list = [
    { site: 'site-a', time_utc: '2026-11-14T00:00', coords: ['', ''] },
    { site: 'custom', time_utc: '2027-01-02T13:45', coords: ['−85.5', ' 31.6 '] },
  ];
  const q = encodeScenarios(list, cfg);
  assert.equal(q, '?s=site-a,2026-11-14T00:00&s=custom,-85.5,31.6,2027-01-02T13:45');
  assert.deepEqual(decodeScenarios(q, opts), {
    scenarios: [{ site: 'site-a', time_utc: '2026-11-14T00:00' }, { site: 'custom', time_utc: '2027-01-02T13:45', coords: ['-85.5', '31.6'] }],
    rejected: 0,
  });
});

test('percent-encoded links read the same', () => {
  assert.deepEqual(decodeScenarios('?s=site-b%2C2026-11-14T06%3A00', opts).scenarios, [{ site: 'site-b', time_utc: '2026-11-14T06:00' }]);
});

test('bad values are skipped and counted; none readable = empty list', () => {
  const bad = ['s=nowhere,2026-11-14T00:00', 's=site-a,2026-13-40T00:00', 's=site-a', 's=custom,95,10,2026-11-14T00:00',
    's=custom,10,2026-11-14T00:00', 's=site-a,2026-11-14T00:00,x', 's=<script>,2026-11-14T00:00'];
  assert.deepEqual(decodeScenarios('?' + bad.join('&'), opts), { scenarios: [], rejected: bad.length });
  assert.deepEqual(decodeScenarios('', opts), { scenarios: [], rejected: 0 });
  assert.deepEqual(decodeScenarios('?other=1', opts), { scenarios: [], rejected: 0 });
});

test('own coordinates rejected when that item is off; extra scenarios beyond max counted', () => {
  assert.equal(decodeScenarios('?s=custom,10,20,2026-11-14T00:00', { ...opts, custom: null }).rejected, 1);
  const five = Array.from({ length: 5 }, () => 's=site-a,2026-11-14T00:00').join('&');
  const r = decodeScenarios('?' + five, opts);
  assert.equal(r.scenarios.length, 4);
  assert.equal(r.rejected, 1);
});

test('Now: current hour inside the data, null outside', () => {
  const range = { startMs: parseUtc('2026-11-01T00:00'), endMs: parseUtc('2027-11-01T00:00') };
  assert.equal(nowTime(parseUtc('2026-11-15T08:42'), range, 60), '2026-11-15T08:00');
  assert.equal(nowTime(parseUtc('2027-11-01T00:30'), range, 60), '2027-11-01T00:00');
  assert.equal(nowTime(parseUtc('2027-11-01T01:00'), range, 60), null);
  assert.equal(nowTime(parseUtc('2026-10-31T23:59'), range, 60), null);
});

test('verdict sentence follows the two answers', () => {
  assert.match(verdictText(t, 'X', { sun: false, earth: true }), /^At this time X has a direct line to Earth but no sunlight/);
  assert.match(verdictText(t, 'X', { sun: true, earth: false }), /sunlight for solar power but no direct line to Earth/);
  assert.match(verdictText(t, 'X', { sun: true, earth: true }), /sunlight for solar power and a direct line to Earth/);
  assert.match(verdictText(t, 'X', { sun: false, earth: false }), /no sunlight for solar power and no direct line to Earth/);
});

test('verdictText adds one sentence per disc that is only partly above the horizon (P4u)', () => {
  const en = JSON.parse(readFileSync(new URL('../i18n/en.json', import.meta.url), 'utf8'));
  const tt = (k) => en[k] ?? k;
  const both = verdictText(tt, 'X', { sun: true, earth: true }, { sun: 'part', earth: 'full' });
  assert.ok(both.endsWith(en['verdict.part_sun']));
  assert.ok(!both.includes(en['verdict.part_earth']));
  assert.equal(verdictText(tt, 'X', { sun: true, earth: true }, { sun: 'full', earth: 'full' }), verdictText(tt, 'X', { sun: true, earth: true }));
});
