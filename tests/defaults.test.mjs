// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Default pair (P4v): the first two cards on the Compare page must differ in at least one answer.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { sampleAt, parseUtc } from '../src/ephem.js';
import { judge } from '../src/shifts.js';

const root = new URL('../', import.meta.url);
const read = (p) => JSON.parse(readFileSync(new URL(p, root), 'utf8'));
const view = read('config/view.json');

function answers({ site, time_utc }) {
  const table = read(`data/ephem/${site}.json`);
  const hp = `data/horizon/${site}.json`;
  const profile = existsSync(new URL(hp, root)) ? read(hp) : null;
  const j = judge(sampleAt(table, parseUtc(time_utc)), profile, view.horizon_threshold_deg);
  return [j.sun.up, j.earth.up];
}

test('the two default scenarios give different answers; the first stays IM-2 at 2026-11-14 00:00 UTC', () => {
  const [a, b] = view.default_scenarios;
  assert.deepEqual(a, { site: 'im-2', time_utc: '2026-11-14T00:00' });
  assert.notDeepEqual(answers(a), answers(b));
});
