// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Site header brand and footer (ADR 0111): every label is in every language, every own link points at a page or file the build
// publishes, the README anchor exists, and the footer carries the SI disclosure link once, with no raw key left.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { footerHtml, markSvg, resolveHref } from '../src/frame.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (p) => JSON.parse(readFileSync(root + p, 'utf8'));
const cfg = read('config/frame.json');
const app = read('config/app.json');
const links = cfg.footer.flatMap((g) => g.links);
const keys = ['app.name', cfg.tagline, ...cfg.footer.flatMap((g) => [g.heading, ...g.links.map((l) => l.key), ...(g.notes ?? [])])];

test('frame: every label is in every language file', () => {
  for (const lang of ['en', 'id', 'ms']) {
    const d = read(`i18n/${lang}.json`);
    for (const k of keys) assert.ok(d[k], `${lang} ${k}`);
  }
});

test('frame: own links point at a page or file the build publishes; the README anchor is a README heading', () => {
  for (const l of links.filter((x) => x.href.startsWith('./'))) {
    const f = l.href === './' ? 'index.html' : l.href.slice(2);
    assert.ok(existsSync(root + f) || existsSync(`${root}src/${f}`), l.href);
  }
  const anchor = links.find((l) => l.href.startsWith('repo:#')).href.slice(6);
  const slugs = readFileSync(`${root}README.md`, 'utf8').split('\n').filter((l) => /^#+ /.test(l))
    .map((l) => l.replace(/^#+ /, '').trim().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'));
  assert.ok(slugs.includes(anchor), anchor);
  assert.ok(existsSync(`${root}LICENSE`));
});

test('frame: three link groups, one SI disclosure link, no raw key; the mark is decorative', () => {
  const en = read('i18n/en.json');
  const html = footerHtml((k) => en[k] ?? k, app, cfg);
  assert.equal((html.match(/class="foot-col"/g) ?? []).length, 3);
  assert.equal((html.match(/id="si-link"/g) ?? []).length, 1);
  assert.ok(html.includes(`href="${app.repo_url}${app.si_disclosure_path}"`));
  assert.ok(!html.includes('footer.') && !/\{[a-z_]+\}/.test(html), 'raw key or placeholder');
  assert.match(markSvg(22), /aria-hidden="true"/);
  assert.equal(resolveHref('repo:/blob/main/LICENSE', app), `${app.repo_url}/blob/main/LICENSE`);
  assert.equal(resolveHref('./play.html', app), './play.html');
});
