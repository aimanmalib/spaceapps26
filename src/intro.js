// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Opening screen (ADR 0114): a full-screen layer over Compare, once per browser session, with the Apollo 8 Earthrise photo,
// the name, one question and two buttons (open the navigator, take the tour). A native modal dialog: keyboard focus stays
// inside, Esc closes. Never under automation (navigator.webdriver) or on a shared link (?s=), so shared links, the smoke
// test and the media captures see the page as before. The page under it is not changed.
import { escapeHtml as e } from './i18n.js';

// Pure: should the opening screen show? cfg = config/view.json intro; search = location.search.
export function introWanted({ cfg, webdriver, search, seen, shareParam }) {
  if (!cfg?.enabled || webdriver || seen) return false;
  return !new URLSearchParams(search).has(shareParam);
}

export function introHtml(t, cfg, withTour) {
  return (
    `<img class="intro-photo" src="${e(cfg.photo)}" alt="" decoding="async" fetchpriority="high" />` +
    '<div class="intro-shade" aria-hidden="true"></div>' +
    `<div class="intro-body"><h2 class="intro-title" id="intro-title">${e(t('app.name'))}</h2>` +
    `<p class="intro-lede">${e(t('intro.lede'))}</p><div class="intro-actions">` +
    `<button type="button" class="btn btn-main intro-open" autofocus>${e(t('intro.open'))}</button>` +
    (withTour ? `<button type="button" class="btn intro-tour">${e(t('intro.tour'))}</button>` : '') +
    `</div><p class="intro-credit">${e(t('intro.credit'))}</p></div>`
  );
}

const storage = (win) => {
  try {
    return win.sessionStorage;
  } catch {
    return null;
  }
};

export function mountIntro({ t, cfg, shareParam, win = globalThis.window }) {
  const doc = win?.document;
  if (!doc?.createElement || typeof doc.createElement('dialog').showModal !== 'function') return null;
  const store = storage(win);
  let seen = false;
  try {
    seen = store?.getItem(cfg?.session_key) === '1';
  } catch {
    seen = false;
  }
  if (!introWanted({ cfg, webdriver: win.navigator?.webdriver === true, search: win.location?.search ?? '', seen, shareParam })) return null;
  try {
    store?.setItem(cfg.session_key, '1');
  } catch {
    /* private mode or blocked storage: it shows again on the next load */
  }
  const tourBtn = doc.querySelector('.tour-start');
  const dlg = doc.createElement('dialog');
  dlg.className = 'intro';
  dlg.setAttribute('aria-labelledby', 'intro-title');
  dlg.innerHTML = introHtml(t, cfg, !!tourBtn);
  doc.body.append(dlg);
  const close = () => dlg.open && dlg.close();
  dlg.querySelector('.intro-open').addEventListener('click', close);
  dlg.querySelector('.intro-tour')?.addEventListener('click', () => {
    close();
    tourBtn.click();
  });
  // A click anywhere but on the two buttons closes it as well.
  dlg.addEventListener('click', (ev) => {
    if (!ev.target.closest('.intro-actions')) close();
  });
  dlg.addEventListener('close', () => dlg.remove());
  dlg.showModal();
  return dlg;
}
