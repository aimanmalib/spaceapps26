// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Opening screen (ADR 0114): when it shows (never under automation, on a shared link or twice in a session), its text in
// every language, and the photo it names exists.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { introWanted, introHtml } from '../src/intro.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (p) => JSON.parse(readFileSync(root + p, 'utf8'));
const view = read('config/view.json');
const cfg = view.intro;
const base = { cfg, webdriver: false, search: '', seen: false, shareParam: view.share.param };

test('intro: shows on a plain first visit only', () => {
  assert.equal(introWanted(base), true);
  assert.equal(introWanted({ ...base, search: '?lang=ms' }), true);
  assert.equal(introWanted({ ...base, webdriver: true }), false);
  assert.equal(introWanted({ ...base, search: `?${view.share.param}=im-2,2026-11-14T00:00` }), false);
  assert.equal(introWanted({ ...base, seen: true }), false);
  assert.equal(introWanted({ ...base, cfg: { ...cfg, enabled: false } }), false);
});

test('intro: text in every language, the photo exists, the main button has focus first', () => {
  for (const lang of ['en', 'id', 'ms']) {
    const d = read(`i18n/${lang}.json`);
    for (const k of ['intro.lede', 'intro.open', 'intro.tour', 'intro.credit', 'app.name']) assert.ok(d[k], `${lang} ${k}`);
    const html = introHtml((k) => d[k] ?? k, cfg, true);
    assert.ok(!html.includes('intro.') || html.includes('class="intro'), 'no raw key');
    assert.match(html, /class="btn btn-main intro-open" autofocus/);
  }
  assert.ok(existsSync(`${root}public/${cfg.photo.replace('./', '')}`), cfg.photo);
  assert.ok(!introHtml((k) => k, cfg, false).includes('intro-tour'), 'no tour button when the page has no tour');
});
