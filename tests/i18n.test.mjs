// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { makeT } from '../src/i18n.js';

const root = new URL('../', import.meta.url);
const en = JSON.parse(readFileSync(new URL('i18n/en.json', root), 'utf8'));
const html = readFileSync(new URL('index.html', root), 'utf8');

test('every data-i18n key used in index.html exists in i18n/en.json', () => {
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
  for (const kind of ['power', 'comm']) for (const s of ['up', 'down', 'yes', 'no']) keys.add(`${kind}.${s}`);
  for (const a of ['0', '90', '180', '270', '360']) keys.add(`sky.az.${a}`);
  assert.ok(keys.size > 10);
  assert.deepEqual([...keys].filter((k) => !(k in en)), []);
});
