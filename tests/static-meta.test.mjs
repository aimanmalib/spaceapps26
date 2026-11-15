// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { staticMeta } from '../src/static-meta.js';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const PAGE = '<head>\n<meta name="description" content="" data-i18n-attr="content:k.d" />\n<title data-i18n="k.t"></title>\n</head>';

test('static meta writes title, description, og: tags and a relative favicon link from the language file', () => {
  const out = staticMeta(PAGE, { 'k.t': 'A "T" <x>', 'k.d': 'D & more' });
  assert.match(out, /<title data-i18n="k.t">A &quot;T&quot; &lt;x&gt;<\/title>/);
  assert.match(out, /<meta name="description" content="D &amp; more"/);
  assert.match(out, /<meta property="og:title" content="A &quot;T&quot; &lt;x&gt;" \/>/);
  assert.match(out, /<meta property="og:description" content="D &amp; more" \/>/);
  assert.match(out, /<link rel="icon" href="\.\/favicon\.svg"/);
  assert.equal(staticMeta(out, { 'k.t': 'A', 'k.d': 'D' }).match(/rel="icon"/g).length, 1, 'running twice adds nothing');
});

test('every page names title and description keys that exist in i18n/en.json', () => {
  const en = JSON.parse(read('i18n/en.json'));
  for (const p of ['index.html', 'about.html', 'validation.html', 'sources.html', 'src/play.html', 'src/teach.html']) {
    const out = staticMeta(read(p), en);
    assert.match(out, /<meta property="og:title" content="[^"]+"/, p);
    assert.match(out, /<meta property="og:description" content="[^"]+"/, p);
    assert.doesNotMatch(out, /<meta name="description" content=""/, p);
  }
});

test('robots.txt allows crawling and the favicon is a plain SVG with no external reference', () => {
  assert.match(read('public/robots.txt'), /^User-agent: \*\nAllow: \/\n$/);
  const svg = read('public/favicon.svg');
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.doesNotMatch(svg.replace('http://www.w3.org/2000/svg', ''), /https?:|href=|<image/);
});

test('deploy/pages.sh prepares the gh-pages branch only: no Pages switch, no visibility change, hook git env cleared', () => {
  const sh = read('deploy/pages.sh').split('\n').filter((l) => !l.startsWith('#')).join('\n');
  assert.match(sh, /BRANCH=gh-pages/);
  assert.match(sh, /unset GIT_DIR GIT_INDEX_FILE GIT_WORK_TREE/);
  assert.match(sh, /\.nojekyll/);
  assert.doesNotMatch(sh, /gh (repo edit|api)|visibility|repos\/[^ ]*\/pages/);
});
