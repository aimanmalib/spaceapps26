// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Shared start for every page: pick the interface language (?lang=, P4t), fill [data-i18n] text, point the footer link at
// SI-DISCLOSURE.md in the repository and add the language switcher to the footer.
import en from '../i18n/en.json';
import app from '../config/app.json';
import langCfg from '../config/lang.json';
import { makeT, applyText, escapeHtml as e } from './i18n.js';
import { pickLang, withLang, isOwnPage } from './lang.js';

// Translations load only when asked for, so the English page carries no extra text.
const loaders = import.meta.glob(['../i18n/*.json', '!../i18n/en.json'], { import: 'default' });
export const lang = typeof location === 'undefined' ? langCfg.default : pickLang(location.search, langCfg);
const dict = lang === langCfg.default ? en : await loaders[`../i18n/${lang}.json`]();

function keepLang(doc) {
  const base = doc.location.href;
  const fix = (a) => {
    const href = a.getAttribute('href');
    if (href && !href.startsWith('#') && isOwnPage(href, base) && !new URL(href, base).searchParams.has(langCfg.param)) {
      a.setAttribute('href', withLang(href, lang, langCfg, base));
    }
  };
  for (const a of doc.querySelectorAll('a[href]')) fix(a);
  // Links written later by the page (cards, game, teachers' page) are fixed when followed.
  doc.addEventListener('click', (ev) => { const a = ev.target.closest?.('a[href]'); if (a) fix(a); }, true);
}

function switcher(doc, t) {
  const foot = doc.querySelector('footer.foot');
  if (!foot) return;
  const nav = doc.createElement('nav');
  nav.className = 'langs';
  nav.setAttribute('aria-label', t('lang.label'));
  nav.innerHTML = langCfg.languages.map((l) => {
    const href = withLang(doc.location.href, l.code, langCfg, doc.location.href);
    const cur = l.code === lang ? ' aria-current="true"' : '';
    return `<a href="${e(href)}" lang="${e(l.code)}" hreflang="${e(l.code)}"${cur}>${e(l.label)}</a>`;
  }).join('<span aria-hidden="true">·</span>');
  foot.append(nav);
  if (lang !== langCfg.default) {
    const note = doc.createElement('p');
    note.className = 'lang-note';
    note.textContent = t('lang.note');
    foot.append(note);
  }
}

// First footer line: what this page belongs to, with the source code and the slide deck one click away.
function identity(doc, t) {
  const foot = doc.querySelector('footer.foot');
  if (!foot) return;
  const p = doc.createElement('p');
  p.className = 'foot-id';
  p.innerHTML = `<span class="fi-entry">${e(t('footer.entry'))}</span>` +
    `<span class="fi-rest">${e(t('footer.team'))} <span aria-hidden="true">·</span> <a href="${e(app.repo_url)}">${e(t('footer.code'))}</a>` +
    ` <span aria-hidden="true">·</span> <a href="./demo/demo.pdf">${e(t('footer.slides'))}</a></span>`;
  foot.prepend(p);
}

// The page links are one row that scrolls sideways when it does not fit (phones, ADR 0107): start it scrolled so the
// current page's link is in view. Sets scrollLeft of the row only, so the page itself never moves.
export function revealCurrentLink(doc) {
  const nav = doc.querySelector('.topnav');
  const cur = nav?.querySelector('a[aria-current="page"]');
  if (!cur || nav.scrollWidth <= nav.clientWidth) return;
  const off = cur.getBoundingClientRect().left - nav.getBoundingClientRect().left + nav.scrollLeft;
  nav.scrollLeft = Math.max(0, off - (nav.clientWidth - cur.offsetWidth) / 2);
}

export function initPage(doc = document) {
  const t = makeT(dict);
  doc.documentElement.lang = lang;
  applyText(doc, t);
  revealCurrentLink(doc);
  const si = doc.getElementById('si-link');
  if (si) si.href = app.repo_url + app.si_disclosure_path;
  identity(doc, t);
  switcher(doc, t);
  if (lang !== langCfg.default) keepLang(doc);
  return { t, app, lang };
}
