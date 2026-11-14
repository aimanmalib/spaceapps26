// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { makeT } from '../src/i18n.js';

const root = new URL('../', import.meta.url);
const en = JSON.parse(readFileSync(new URL('i18n/en.json', root), 'utf8'));
const html = ['index.html', 'validation.html'].map((f) => readFileSync(new URL(f, root), 'utf8')).join('\n');

test('every data-i18n key used in index.html and validation.html exists in i18n/en.json', () => {
  const keys = [...html.matchAll(/data-i18n="([^"]+)"/g)].map((m) => m[1]);
  for (const m of html.matchAll(/data-i18n-attr="([^"]+)"/g)) {
    for (const pair of m[1].split(';')) keys.push(pair.split(':')[1].trim());
  }
  assert.ok(keys.length > 0);
  const missing = keys.filter((k) => !(k in en));
  assert.deepEqual(missing, []);
});

test('makeT returns the text, or the key itself when missing', () => {
  const t = makeT({ a: 'Alpha' });
  assert.equal(t('a'), 'Alpha');
  assert.equal(t('nope'), 'nope');
  assert.equal(t('toString'), 'toString');
});

test('no UI text value is empty', () => {
  const empty = Object.entries(en).filter(([, v]) => typeof v !== 'string' || !v.trim()).map(([k]) => k);
  assert.deepEqual(empty, []);
});

test("every t('key') used in src/*.js exists in i18n/en.json (prefix keys like 'power.' + suffix are expanded)", async () => {
  const { readdirSync } = await import('node:fs');
  const dir = new URL('src/', root);
  const keys = new Set();
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.js'))) {
    const src = readFileSync(new URL(f, dir), 'utf8');
    for (const m of src.matchAll(/\bt\('([a-z0-9_.]+)'\)/g)) keys.add(m[1]);
  }
  for (const kind of ['power', 'comm']) for (const s of ['yes', 'no']) keys.add(`${kind}.${s}`);
  for (const a of ['0', '90', '180', '270', '360']) keys.add(`sky.az.${a}`);
  for (const b of ['sun', 'earth']) {
    for (const s of ['set_in', 'rise_in', 'no_set', 'no_rise']) keys.add(`time.${b}.${s}`);
    for (const s of ['now', 'next']) keys.add(`win.${b}.${s}`);
  }
  for (const kind of ['power', 'comm']) keys.add(`${kind}.el_label`);
  for (const u of ['d', 'h', 'min']) keys.add(`dur.${u}`);
  for (const q of ['sun_az', 'sun_el', 'earth_az', 'earth_el']) keys.add(`val.q.${q}`);
  assert.ok(keys.size > 10);
  assert.deepEqual([...keys].filter((k) => !(k in en)), []);
});
