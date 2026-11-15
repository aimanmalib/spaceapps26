// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// P4t: optional Indonesian and Malay interface text. English stays the default and the reference.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pickLang, withLang, isOwnPage } from '../src/lang.js';

const root = new URL('../', import.meta.url);
const read = (f) => JSON.parse(readFileSync(new URL(f, root), 'utf8'));
const en = read('i18n/en.json');
const cfg = read('config/lang.json');
const others = cfg.languages.map((l) => l.code).filter((c) => c !== cfg.default);
const holders = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

test('English is the default and every offered language has a text file', () => {
  assert.equal(cfg.default, 'en');
  assert.ok(others.length >= 1);
  for (const c of others) assert.equal(typeof read(`i18n/${c}.json`), 'object');
});

for (const code of others) {
  const tr = read(`i18n/${code}.json`);
  test(`${code}: same keys as en.json, none empty, same {placeholders}`, () => {
    assert.deepEqual(Object.keys(en).filter((k) => !(k in tr)), [], 'missing keys');
    assert.deepEqual(Object.keys(tr).filter((k) => !(k in en)), [], 'extra keys');
    assert.deepEqual(Object.entries(tr).filter(([, v]) => typeof v !== 'string' || !v.trim()).map(([k]) => k), []);
    assert.deepEqual(Object.keys(en).filter((k) => holders(en[k]).join() !== holders(tr[k]).join()), [], 'placeholders differ');
  });
  test(`${code}: the translation note is translated (it is shown only on non-English pages)`, () => {
    assert.notEqual(tr['lang.note'], en['lang.note']);
  });
}

test('pickLang: offered code from ?lang=, anything else falls back to English', () => {
  assert.equal(pickLang('?lang=id', cfg), 'id');
  assert.equal(pickLang('?s=im-2,2026-11-14T00:00&lang=ms', cfg), 'ms');
  assert.equal(pickLang('', cfg), 'en');
  assert.equal(pickLang('?lang=fr', cfg), 'en');
  assert.equal(pickLang('?lang=', cfg), 'en');
});

test('withLang keeps other parameters and drops the parameter for English', () => {
  const base = 'https://x.test/a/';
  assert.equal(withLang('./?s=im-1,2026-11-14T00:00', 'id', cfg, base), 'https://x.test/a/?s=im-1%2C2026-11-14T00%3A00&lang=id');
  assert.equal(withLang('https://x.test/a/about.html?lang=ms', 'en', cfg, base), 'https://x.test/a/about.html');
  assert.equal(withLang('about.html#x', 'ms', cfg, base), 'https://x.test/a/about.html?lang=ms#x');
});

test('isOwnPage: same-origin pages only (not data files, not other hosts)', () => {
  const base = 'https://x.test/a/index.html';
  assert.ok(isOwnPage('./', base));
  assert.ok(isOwnPage('./play.html', base));
  assert.ok(!isOwnPage('./data/SOURCES.json', base));
  assert.ok(!isOwnPage('./demo/demo.pdf', base));
  assert.ok(!isOwnPage('https://github.com/aimanmalib/spaceapps26/', base));
});
