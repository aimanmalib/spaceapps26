// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Site header brand and footer (ADR 0111): the same mark, name and link groups on every page, from config/frame.json and the
// i18n files. Its own module, so other page work (cards, a tour button near the header) does not touch it. No JSON import
// here: page.js passes the config in, so tests run this file in Node as it is.
import { escapeHtml as e } from './i18n.js';

if (typeof document !== 'undefined') import('./frame.css');

// The mark of ADR 0107 (the Sun and Earth above a lunar horizon, as in the answers' colours), now drawn once as SVG for the
// header and footer. Drawn for this project; it is not a NASA logo. h = height in px; the mark is 20 × 14.
export function markSvg(h) {
  return `<svg class="mark" width="${Math.round((h * 20) / 14)}" height="${h}" viewBox="0 0 20 14" aria-hidden="true" focusable="false">` +
    '<path class="mark-ground" d="M1 12.5Q6 9.5 10 10.5T19 10"/><circle class="mark-sun" cx="6" cy="5.5" r="2.75"/>' +
    '<circle class="mark-earth" cx="14.5" cy="4" r="2.25"/></svg>';
}

// config href → address: a page of this site as written, 'repo:<suffix>' in the source repository, 'si:' the SI disclosure.
export function resolveHref(href, app) {
  if (href === 'si:') return app.repo_url + app.si_disclosure_path;
  return href.startsWith('repo:') ? app.repo_url + href.slice(5) : href;
}

const brand = (t, cfg, px) => `<a class="brand" href="${e(cfg.home)}">${markSvg(px)}<span class="brand-name">${e(t('app.name'))}</span></a>`;

export function footerHtml(t, app, cfg) {
  const link = (l) => `<a href="${e(resolveHref(l.href, app))}"${l.id ? ` id="${e(l.id)}"` : ''}>${e(t(l.key))}</a>`;
  const groups = cfg.footer.map((g, i) =>
    `<nav class="foot-col" aria-labelledby="foot-h-${i}"><h2 class="foot-h" id="foot-h-${i}">${e(t(g.heading))}</h2>` +
    `<ul>${g.links.map((l) => `<li>${link(l)}</li>`).join('')}</ul>` +
    (g.notes ?? []).map((k) => `<p class="foot-note">${e(t(k))}</p>`).join('') + '</nav>').join('');
  return `<div class="foot-grid"><div class="foot-brand">${brand(t, cfg, 20)}<p>${e(t(cfg.tagline))}</p></div>${groups}</div>` +
    '<div class="foot-bottom"></div>';
}

// Header: the brand goes first in the page-link row (same row, so the first screen keeps its height).
// Footer: brand and link groups on top; the page's own footer lines (SI sentence, photo credit) move to the bottom row.
export function mountFrame(doc, t, app, cfg) {
  const nav = doc.querySelector('.topnav');
  if (nav && !nav.querySelector('.brand')) nav.insertAdjacentHTML('afterbegin', brand(t, cfg, 15));
  const foot = doc.querySelector('footer.foot');
  if (!foot || foot.classList.contains('is-framed')) return;
  // Kept: text lines of this page's footer. Replaced by the groups: the SI link, the licence word and the separators.
  const keep = [...foot.children].filter((n) => n.dataset.i18n && n.tagName !== 'A' && n.dataset.i18n !== 'footer.license');
  foot.classList.add('is-framed');
  foot.innerHTML = footerHtml(t, app, cfg);
  foot.querySelector('.foot-bottom').append(...keep);
}
