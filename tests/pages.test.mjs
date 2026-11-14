// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { makeT } from '../src/i18n.js';
import { itemsHtml, limitationsHtml, limitationKeys } from '../src/about.js';
import { filesHtml, sitesHtml, shortUrl, urlLabel } from '../src/sources.js';

const root = new URL('../', import.meta.url);
const json = (p) => JSON.parse(readFileSync(new URL(p, root), 'utf8'));
const en = json('i18n/en.json');
const t = makeT(en);
const features = json('config/features.json').items;

test('every challenge item a–l switched in config/features.json has About text', () => {
  const missing = Object.keys(features).filter((k) => !(`about.item.${k}` in en));
  assert.deepEqual(missing, []);
});

test('About lists every item in order and marks one that is switched off', () => {
  const html = itemsHtml(t, { a_x: true, b_y: false }, {});
  assert.equal((html.match(/<li /g) || []).length, 2);
  assert.ok(html.indexOf('>a<') < html.indexOf('>b<'));
  assert.equal((html.match(/is-off/g) || []).length, 1);
  assert.ok(html.includes(en['about.item.off']));
});

test('About fills placeholders and lists every about.lim.* key in file order', () => {
  const dict = { 'about.lim.2': 'two {max}', other: 'x', 'about.lim.1': 'one' };
  assert.deepEqual(limitationKeys(dict), ['about.lim.2', 'about.lim.1']);
  const html = limitationsHtml(makeT(dict), dict, { max: 4 });
  assert.ok(html.indexOf('two 4') < html.indexOf('one'));
  assert.ok(!html.includes('{max}'));
  assert.ok(limitationKeys(en).length >= 3);
});

test('Data sources lists every frozen file with its source, script and escaped text', () => {
  const sources = {
    files: [
      { file: 'ephem/a.json', url: 'https://h.example/api?x=1&y=<2>', retrieved_at: '2026-11-14T00:00:00Z', license: 'Credit <A>', script: 'scripts/f.py' },
      { file: 'b.json', url: 'https://h.example/b', urls: ['https://h.example/b1', 'https://h.example/b2'], retrieved_at: 'r', license: 'L', script: 's.py', pgda: { urls: ['http://p.example/x.IMG'], license: 'P' } },
    ],
  };
  const html = filesHtml(t, sources, 'https://repo.example');
  assert.equal((html.match(/class="src-item"/g) || []).length, 2);
  assert.ok(html.includes('href="./data/ephem/a.json"'));
  assert.ok(html.includes('https://repo.example/blob/main/scripts/f.py'));
  assert.ok(html.includes('Credit &lt;A&gt;') && !html.includes('<A>'));
  for (const h of ['h.example/b1', 'h.example/b2', 'p.example/x.IMG']) assert.ok(html.includes(h), h);
});

test('Data sources covers every file in data/SOURCES.json and every listed site', () => {
  const sources = json('data/SOURCES.json');
  const html = filesHtml(t, sources, 'https://repo.example');
  for (const f of sources.files) assert.ok(html.includes(`./data/${f.file}`), f.file);
  const sites = json('config/sites.json').sites;
  const sh = sitesHtml(t, sites);
  assert.equal((sh.match(/class="src-item"/g) || []).length, sites.length);
});

test('shortUrl keeps host and path, drops the query', () => {
  assert.equal(shortUrl('https://ssd.jpl.nasa.gov/api/horizons.api?format=json'), 'ssd.jpl.nasa.gov/api/horizons.api');
  assert.equal(shortUrl('not a url'), 'not a url');
});

test('Horizons request links name the body (Sun / Earth); other links stay plain', () => {
  const tt = makeT({ 'sources.cmd.10': 'Sun', 'sources.cmd.399': 'Earth' });
  assert.equal(urlLabel(tt, "https://h.example/api?COMMAND=%2710%27&x=1"), 'h.example/api — Sun');
  assert.equal(urlLabel(tt, "https://h.example/api?COMMAND=%27399%27"), 'h.example/api — Earth');
  assert.equal(urlLabel(tt, "https://h.example/api?COMMAND=%27301%27"), 'h.example/api');
  assert.equal(urlLabel(tt, 'https://p.example/x.img'), 'p.example/x.img');
});
